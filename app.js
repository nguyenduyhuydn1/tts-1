const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const readline = require("readline");
const morgan = require("morgan");
const serveIndex = require("serve-index");
require("dotenv").config();
const { argv } = require("process");

const indexRouter = require("./routes/index");
const torrentRouter = require("./routes/torrent");
const downloadRouter = require("./routes/download");
const delRouter = require("./routes/del");
const srtRouter = require("./routes/srt");

app.use(cors());
app.use(morgan("dev"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(
    "/files",
    express.static("public"),
    serveIndex("public", { icons: true })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "5mb" }));

//routes
app.use("/api", indexRouter);
app.use("/torrent", torrentRouter);
app.use("/download", downloadRouter);
app.use("/del", delRouter);
app.use("/srt", srtRouter);

if (true || process.env.PRODUCT === "production") {
    app.use(express.static(path.join(__dirname, "fe-wb", "dist")));
    app.get("*", (req, res) => {
        res.sendFile(
            path.join(path.join(__dirname, "fe-wb", "dist", "index.html"))
        );
    });
} else {
    app.get("/", (req, res) => {
        res.send("runing app");
    });
}

const processLineByLine = async (check = true) => {
    const urlEnv = __dirname + "/utils/save.txt";
    const fileStream = fs.createReadStream(urlEnv);
    let temp = "";
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    for await (let line of rl) {
        if (line.includes("COUNT_API")) {
            let number = +line.match(/\d+/g)[0];
            if (check) line = `COUNT_API=${number + 1}`;
            else line = `COUNT_API=${number - 1}`;
        }
        temp += line + "\n";
    }
    fs.writeFile(urlEnv, temp, (err) => console.log(err, "processLineByLine"));
};

let args = argv.slice(2);
console.log(args);
if (args[0] == 1) processLineByLine();
else processLineByLine(false);

//handle error
app.use((req, res, next) => {
    res.statusCode = 404;
    next(new Error("not found"));
});

app.use((err, req, res, next) => {
    res.status(res.statusCode !== 200 ? 500 : res.statusCode);
    res.json({
        message: err.message,
        stack: err.stack,
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
