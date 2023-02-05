import { SOURCES_ID } from "./constants";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import GoogleAuth, { GoogleKey } from "cloudflare-workers-and-google-oauth";

type Announcement = {
  startDate: Dayjs;
  endDate: Dayjs;
  title: string;
  author?: string;
  body: string;
  images?: string[];
};

type XPeriod = {
  rday?: string;
  location?: string;
  event?: string;
};

const service = process.env.GOOGLE_SERVICE_ACCOUNT;
if (!service)
  throw new Error(
    "Environment GOOGLE_SERVICE_ACCOUNT must contain service account JSON from cloud console"
  );

const token = await new GoogleAuth(JSON.parse(service) as GoogleKey, [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
]).getGoogleAuthToken();

async function gFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<any> {
  init.headers = {
    ...init.headers,
    authorization: `Bearer ${token}`,
  };
  return fetch(input, init).then((res) => res.json());
}

const sources: { [key: string]: string } = {};

(
  await gFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SOURCES_ID}/values/sources!A2:B1000?majorDimension=ROWS`
  )
).values.forEach((e: string[]) => {
  // convert [["key", "val"]] to {key: "val"}
  sources[e[0]] = e[1];
});

export function getSource(key: string): string {
  return sources[key];
}

export default class Google extends null {
  static async getImages(): Promise<string[]> {
    const query = new URLSearchParams({
      corpora: "user",
      fields: "files(webContentLink)",
      orderBy: "recency",
      q: `'${sources["images-folder"]}' in parents and trashed = false`,
    });

    return gFetch(`https://www.googleapis.com/drive/v3/files?${query}`).then(
      (resp) => resp.files.map((file: any) => file.webContentLink)
    );
  }

  static async getAnnouncements(): Promise<Announcement[]> {
    // start_date,end_date,title,author,body,images
    return (
      await gFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sources["announcements-id"]}/values/announcements!A2:F1000?majorDimension=ROWS`
      )
    ).values
      .map((row: string[]): Announcement => {
        return {
          startDate: dayjs(row[0]).subtract(1, "day"),
          endDate: dayjs(row[1]).add(1, "day"),
          title: row[2],
          author: row[3],
          body: row[4],
          images: row[5]
            ?.split(/, ?/)
            .map((image) => image.replace("/open?id=", "/uc?id=")),
        };
      })
      .filter(
        (a: Announcement) =>
          a.startDate.isBefore(dayjs()) && a.endDate.isAfter(dayjs())
      );
  }

  static async getX(): Promise<XPeriod> {
    // DATE,DAY,rday,,LOCATION,EVENT,...
    const today = (
      await gFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sources["x-period-id"]}/values/22-23!A2:F1000`
      )
    ).values.filter((row: string[]) => row[0] == dayjs().format("M/D/YYYY"))[0];

    if (!today) return {};

    return {
      rday: today[3],
      location: today[5],
      event: today[6],
    };
  }

  static async getNewsletter(): Promise<string> {
    return getSource("newsletter-id");
  }

  static async getFeedback(): Promise<string> {
    return getSource("feedback");
  }

  static async getSubmission(): Promise<string> {
    return getSource("submission");
  }
}
