import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { SOURCES_ID } from "./constants";
import { JWT } from "google-auth-library"
import { drive } from "@googleapis/drive"
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

const email = process.env.GOOGLE_SERVICE_EMAIL as string;
const key = (process.env.GOOGLE_SERVICE_PRIVATE_KEY as string).replaceAll("\\n", "\n");

const sources_sheet = new GoogleSpreadsheet(SOURCES_ID);
await sources_sheet.useServiceAccountAuth({
  client_email: email,
  private_key: key        
});
await sources_sheet.loadInfo();

const SOURCES: GoogleSpreadsheetWorksheet = sources_sheet.sheetsByTitle[sources_sheet.title];

export async function getSource(key: string): Promise<string> {
    return SOURCES.getRows()
      .then(rows => 
        rows.filter(row => row.key == key)
          .at(0)
          ?.value 
      )
}

const imagesFolder = await getSource("images-folder")
const auth = new JWT(email, undefined, key, ["https://www.googleapis.com/auth/drive"])
const gdrive = drive({version: "v3", auth})

export async function getImages(): Promise<string[]> {
  const files = (await gdrive.files.list({
    q: `'${imagesFolder}' in parents and trashed = false`,
    fields: "files(webContentLink)"
  })).data.files;

  return files?.map(file => file.webContentLink as string) ?? [];
}

const announcementsSheetId = await getSource("announcements-id");
const announcementsSheet = new GoogleSpreadsheet(announcementsSheetId);
await announcementsSheet.useServiceAccountAuth({
  client_email: email,
  private_key: key        
});
await announcementsSheet.loadInfo();

const announcements: GoogleSpreadsheetWorksheet = announcementsSheet.sheetsByTitle[announcementsSheet.title];

type Announcement = {
  startDate: Dayjs,
  endDate: Dayjs,
  title: string,
  body: string,
  image: any
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const rows = await announcements.getRows()

  const announcement = rows.map(row => {
    return {
      startDate: dayjs(row.start_date).subtract(1, 'day'),
      endDate: dayjs(row.end_date).add(1, 'day'),
      title: row.title,
      body: row.body,
      // ex. https://drive.google.com/open?id=IIIDDDD
      image: row.image.replace("/open?id=", "/uc?id=")
    }
  })
    .filter(a => a.startDate.isBefore(dayjs()) && a.endDate.isAfter(dayjs()))
  return announcement;
}