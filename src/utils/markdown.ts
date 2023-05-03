import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants"

marked.use(
    {
        breaks: true,
        gfm: true,
        silent: true,
    },
    markedSmartypants()
)


export default marked;
