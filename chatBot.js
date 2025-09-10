import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import readline from "readline";

dotenv.config();

const INVOICE_DIR = "./invoices";
const DATA_FILE = "./data.json";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


function loadData() {
    return fs.existsSync(DATA_FILE)
        ? JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))
        : [];
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}


async function uploadFile(filePath) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("purpose", "assistants");

    const resp = await axios.post("https://api.openai.com/v1/files", form, {
        headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
    });

    return resp.data.id;
}

async function analyzeFile(filePath) {
    const fileName = path.basename(filePath);
    let fileObj;

    if (fileName.toLowerCase().endsWith(".pdf")) {
        const fileId = await uploadFile(filePath);
        fileObj = {type: "file", file: {file_id: fileId}};
    } else if (/\.(jpe?g|png)$/i.test(fileName)) {
        const b64 = fs.readFileSync(filePath).toString("base64");
        const mime = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
        fileObj = {type: "image_url", image_url: {url: `data:${mime};base64,${b64}`}};
    } else {
        throw new Error(`Unsupported file type: ${fileName}`);
    }

    const resp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-4.1",
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content: "You are an invoice parser. Extract the invoice details into a strict JSON object."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract vendor, invoice_number, invoice_date, due_date, and total. Respond ONLY with valid JSON.",
                        },
                        fileObj,
                    ],
                },
            ],
        },
        {headers: {Authorization: `Bearer ${OPENAI_API_KEY}`}}
    );

    const respContent = resp.data.choices[0].message.content;

    try {
        const match = respContent.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        const parsed = JSON.parse(match ? match[1] : respContent);
        return {...parsed, file_name: fileName};
    } catch {
        throw new Error(`Failed to parse JSON from GPT response: ${respContent}`);
    }
}


async function handleQueryLoop(data) {
    const rl = readline.createInterface({input: process.stdin, output: process.stdout});

    async function ask() {
        rl.question("\nEnter your question (or type 'exit' to quit): ", async (q) => {
            if (q.trim().toLowerCase() === "exit") {
                console.log("Exiting query mode.");
                rl.close();
                return;
            }

            try {
                const resp = await axios.post(
                    "https://api.openai.com/v1/chat/completions",
                    {
                        model: "gpt-4.1-mini",
                        messages: [
                            {
                                role: "system",
                                content: "You are a helpful assistant. Use the provided JSON dataset of invoices to answer queries accurately."
                            },
                            {role: "user", content: `Today date is ${new Date().toISOString().split('T')[0]}.`},
                            {role: "user", content: `Here is the dataset:\n${JSON.stringify(data)}\nNow answer: ${q}`},
                        ],
                    },
                    {headers: {Authorization: `Bearer ${OPENAI_API_KEY}`}}
                );

                console.log("\nAnswer:", resp.data.choices[0].message.content);
            } catch (err) {
                console.error("Error answering query:", err.response?.data || err);
            }

            ask(); // loop again
        });
    }

    ask();
}


async function main() {
    if (!OPENAI_API_KEY) {
        console.error("Please set the OPENAI_API_KEY environment variable.");
        return;
    }

    let data = loadData();

    if (!fs.existsSync(INVOICE_DIR)) {
        fs.mkdirSync(INVOICE_DIR);
        console.log(`Created invoice directory at ${INVOICE_DIR}. Please add invoice files and rerun.`);
        return;
    }

    const files = fs.readdirSync(INVOICE_DIR).filter((f) => /\.(pdf|jpe?g|png)$/i.test(f));
    const newFiles = files.filter((f) => !data.find((d) => d.file_name === f));

    if (newFiles.length) {
        console.log(`Found ${newFiles.length} new file(s). Starting analysis...`);
        for (const file of newFiles) {
            const filePath = path.join(INVOICE_DIR, file);
            try {
                console.log("Analyzing:", file);
                const result = await analyzeFile(filePath);
                data.push(result);
                saveData(data);
                console.log(" Saved:", result);
            } catch (err) {
                console.error("Error processing", file, err.response?.data || err);
            }
        }
    }

    console.log("\n All invoices processed. You can now enter queries.");
    await handleQueryLoop(data);
}

main().catch((err) => console.error("Fatal error:", err));
