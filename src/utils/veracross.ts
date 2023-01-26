import {getSource} from "./google";
import {lines2tree} from "icalts"
import {Cacheable} from "@type-cacheable/core";
import dayjs from "dayjs"

import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const NEWLINE = /\r\n|\r|\n/g

const lunchCal = await getSource("lunch-cal");
const rotationCal = await getSource("rotation-calendar")

export default class Veracross extends null {
    @Cacheable({cacheKey: 'lunch', ttlSeconds: 15 * 60})
    static async getLunch() {
        const cal = lines2tree((await (await fetch(lunchCal)).text()).split(NEWLINE))
        return (cal.VCALENDAR[0]?.VEVENT.filter(event => dayjs(event.DTSTART.__value__, "YYYYMMDD").isSame(dayjs(), 'day')).at(0)?.DESCRIPTION as string)
            .replace(/\\n*$/g, "")
            .replaceAll("\\n", ", ");
    }

    @Cacheable({cacheKey: 'schedule', ttlSeconds: 15 * 60})
    static async getSchedule(): Promise<string[]>{
        const cal = lines2tree((await (await fetch(rotationCal)).text()).split(NEWLINE))

        const schedule = cal.VCALENDAR[0]?.VEVENT
            .filter(event => dayjs(event.DTSTART, "YYYYMMDD[T]HHmmss[Z]").isSame(dayjs(), 'day'))
            .filter(event => !(event.SUMMARY as string).endsWith("L"))
            .map(event => event.SUMMARY.replaceAll(/US |E$/g, ""));
        return schedule?.length > 0 ? schedule : ["Classes not scheduled today"]
    }
}