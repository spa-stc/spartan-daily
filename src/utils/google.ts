import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { SOURCES_ID } from "./constants";
import { JWT } from "google-auth-library"
import { drive } from "@googleapis/drive"

const email = process.env.GOOGLE_SERVICE_EMAIL as string;
const key = process.env.GOOGLE_SERVICE_PRIVATE_KEY as string;

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