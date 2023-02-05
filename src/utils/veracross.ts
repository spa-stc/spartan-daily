import { getSource } from "./google";
import { lines2tree } from "icalts";
import dayjs from "dayjs";

import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

const NEWLINE = /\r\n|\r|\n/g;

const lunchCal = getSource("lunch-cal");
const rotationCal = getSource("rotation-calendar");

type KeyValue = {
  key: string;
  __value__: any;
  [key: string]: string;
};

type ICalSTD = {
  TZOFFSETFROM: string;
  TZOFFSETTO: string;
  TZNAME: string;
  DTSTART: string;
};

type ICalTZ = {
  TZID: string;
  "X-LIC-LOCATION": string;
  STANDARD: ICalSTD[];
};

type ICalMeta = {
  VCALENDAR: VCalMeta[];
};

type VCalMeta = {
  CALSCALE?: string;
  METHOD?: string;
  PRODID?: string;
  VERSION?: string;
  VEVENT?: ICalEvent[];
  VTIMEZONE?: ICalTZ[];
  NAME?: string;
  "X-WR-CALDESC"?: string;
  "X-WR-CALNAME"?: string;
  "X-WR-TIMEZONE"?: string;
};

type ICalEvent = {
  DTSTART?: KeyValue | string;
  DTEND?: KeyValue | string;
  DTSTAMP?: string;
  UID?: string;
  CREATED?: string;
  DESCRIPTION?: string;
  "LAST-MODIFIED"?: string;
  LOCATION?: string;
  SEQUENCE?: string;
  STATUS?: string;
  SUMMARY?: string;
  TRANSP?: string;
};

export default class Veracross extends null {
  static async getLunch() {
    const cal = lines2tree(
      (await (await fetch(lunchCal)).text()).split(NEWLINE)
    ) as ICalMeta;
    return (
      cal.VCALENDAR[0]?.VEVENT?.filter((event) =>
        dayjs((event.DTSTART as KeyValue)?.__value__, "YYYYMMDD").isSame(
          dayjs(),
          "day"
        )
      )
        .at(0)
        ?.DESCRIPTION?.replace(/(\\n)*$/g, "")
        .replaceAll("\\n", ", ") ?? "Lunch not available"
    );
  }

  static async getSchedule(): Promise<string[]> {
    const cal = lines2tree(
      (await (await fetch(rotationCal)).text()).split(NEWLINE)
    ) as ICalMeta;

    const schedule = cal.VCALENDAR[0].VEVENT?.filter((event) =>
      dayjs(event.DTSTART as string, "YYYYMMDD[T]HHmmss[Z]").isSame(
        dayjs(),
        "day"
      )
    )
      .filter((event) => !event.SUMMARY?.endsWith("L"))
      .map((event) => event.SUMMARY?.replaceAll(/US |E$/g, ""));
    return schedule?.length > 0 ? schedule : ["Classes not scheduled today"];
  }
}
