import type { ElysiaApp } from "../index";

export default (app: ElysiaApp) => app
    .get("/",({set})=> {
        set.status = 200;
        return "OK"
    });