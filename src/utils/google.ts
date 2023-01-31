import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { SOURCES_ID } from "./constants";
import { JWT } from "google-auth-library";
import { drive } from "@googleapis/drive";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Cacheable } from "@type-cacheable/core";

const email = process.env.GOOGLE_SERVICE_EMAIL as string;
const key = (process.env.GOOGLE_SERVICE_PRIVATE_KEY as string).replaceAll(
  "\\n",
  "\n"
);

const sources_sheet = new GoogleSpreadsheet(SOURCES_ID);
await sources_sheet.useServiceAccountAuth({
  client_email: email,
  private_key: key,
});
await sources_sheet.loadInfo();

const SOURCES: GoogleSpreadsheetWorksheet =
  sources_sheet.sheetsByTitle[sources_sheet.title];

export async function getSource(key: string): Promise<string> {
  return SOURCES.getRows().then(
    (rows) => rows.filter((row) => row.key == key).at(0)?.value
  );
}

const imagesFolder = await getSource("images-folder");
const auth = new JWT(email, undefined, key, [
  "https://www.googleapis.com/auth/drive",
]);
const gdrive = drive({ version: "v3", auth });

const announcementsSheetId = await getSource("announcements-id");
const announcementsSheet = new GoogleSpreadsheet(announcementsSheetId);
await announcementsSheet.useServiceAccountAuth({
  client_email: email,
  private_key: key,
});

const xSheetId = await getSource("x-period-id");
const xSheet = new GoogleSpreadsheet(xSheetId);
await xSheet.useServiceAccountAuth({
  client_email: email,
  private_key: key,
});

type Announcement = {
  startDate: Dayjs;
  endDate: Dayjs;
  title: string;
  author?: string;
  body: string;
  image?: any;
};

type XPeriod = {
  rday?: string;
  location?: string;
  event?: string;
};

export default class Google extends null {
  @Cacheable({ cacheKey: "images", ttlSeconds: 15 * 60 })
  static async getImages(): Promise<string[]> {
    const files = (
      await gdrive.files.list({
        q: `'${imagesFolder}' in parents and trashed = false`,
        fields: "files(webContentLink)",
      })
    ).data.files;
    return files?.map((file) => file.webContentLink as string) ?? [];
  }

  @Cacheable({ cacheKey: "announcements", ttlSeconds: 15 * 60 })
  static async getAnnouncements(): Promise<Announcement[]> {
    await announcementsSheet.loadInfo();
    const announcements: GoogleSpreadsheetWorksheet =
      announcementsSheet.sheetsByTitle[announcementsSheet.title];
    const rows = await announcements.getRows();

    return rows
      .map((row) => {
        return {
          startDate: dayjs(row.start_date).subtract(1, "day"),
          endDate: dayjs(row.end_date).add(1, "day"),
          title: row.title,
          author: row.author,
          body: row.body,
          // ex. https://drive.google.com/open?id=IIIDDDD
          image: row.image?.replace("/open?id=", "/uc?id="),
        };
      })
      .filter(
        (a) => a.startDate.isBefore(dayjs()) && a.endDate.isAfter(dayjs())
      );
  }

  @Cacheable({ cacheKey: "x", ttlSeconds: 15 * 60 })
  static async getX(): Promise<XPeriod> {
    await xSheet.loadInfo();
    const xPds = xSheet.sheetsByIndex[0];

    const x = (await xPds.getRows()).filter(
      (x) => x.DATE == dayjs().format("M/D/YYYY")
    )[0];
    if (!x) return {};

    return {
      rday: x.rday,
      location: x.LOCATION,
      event: x.EVENT,
    };
  }

  @Cacheable({ cacheKey: "newsletter", ttlSeconds: 60 * 60 * 24 })
  static async getNewsletter(): Promise<string> {
    return getSource("newsletter-id");
  }
}
