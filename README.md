# Invoice Processor with GPT-4.1

This project is a task sent by Kunal Malhotra to myself ( Nitya Arya ) [nitya.01.work@gmail.com](mailto:nitya.01.work@gmail.com)
for Full Stack Development Internship.

## Important Note on API Key

My OpenAI API key included with the task submission for easy demo of script. It is for this task/demo purpose only.

API key will be deactivated after 10 days. / sooner.
It has a limit of 5 USD, so usage is very restricted.
If you want to run the script beyond this demo, please generate your own API key from the OpenAI dashboard.
---
This project is a **command-line tool** that:

1. Reads invoice files (PDFs, JPGs, PNGs) from a local `invoices/` folder.
2. Uploads them to the **OpenAI File API** and asks GPT-4.1 Mini to extract structured invoice data.
3. Saves the extracted details into `data.json`.
4. Lets you query the invoice dataset interactively (like "What’s the total value of all invoices?") until you type
   `exit`.

---

## Features

- ✅ Supports both **PDF and image invoices**.
- ✅ Extracts key fields: `vendor`, `invoice_number`, `invoice_date`, `due_date`, `total`, plus `file_name`.
- ✅ Stores results in `data.json` for reuse.
- ✅ Interactive **query mode** so you can ask unlimited questions about the invoices.

---

## Setup

### 1. Unzip and setup

Unzip the project and navigate into it.

### 2. Install Dependencies

```bash
npm install
```

This project uses:

- `axios` – HTTP requests to OpenAI
- `form-data` – for uploading files
- `readline` – for interactive query mode

### 3. Environment Variable

Set your OpenAI API key in the .env file like this:
```bash
OPENAI_API_KEY="your_api_key_here"
```

### 4. Prepare Invoices

Create the `invoices/` directory (done automatically if missing) and place some invoice files inside:

```
invoices/
  ├── Invoice-001.pdf
  ├── Invoice-002.png
  └── Invoice-003.jpg
```

### 5. Run

```bash
node chatBot.js
```

- The tool will process new invoices, extract data, and save them to `data.json`.
- Once all invoices are processed, it enters **query mode** where you can ask questions.
- Type `exit` to quit query mode.

---

## Example

### Sample `data.json`

```json
[
  {
    "vendor": "Amazon",
    "invoice_number": "INV-0012",
    "invoice_date": "2025-08-20",
    "due_date": "2025-09-05",
    "total": 2450.0,
    "file_name": "Invoice-001.pdf"
  }
]
```

### Query Mode

```bash
Enter your query (or type 'exit' to quit): What is the total value of Amazon invoices?

Answer: The total value of invoices from Amazon is $2450.00
```

## Example Question and Answer

#### What is the total value of all invoices?

#### Answer: "The total value of all invoices is $2450.00"

--

#### Which invoices are due next week?

#### Answer: The invoices due next week are INV-0012 from Amazon, due on 2025-09-05.

---

## Notes

- Files are uploaded to OpenAI for parsing. You may delete them afterwards from your OpenAI account if desired.
- If a file has already been processed, it won’t be re-analyzed (cached in `data.json`).
- The system is lightweight — no database required, just `data.json`.

---