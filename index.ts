import { LoggerModule } from "./src";

const log = new LoggerModule({
	name: "yes!",
	timeformat: "en-AU"
});

const err = new Error("my balls itch");

log.log("ERROR", err);