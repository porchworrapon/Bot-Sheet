const { google } = require("googleapis");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(__dirname, "../../google.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const botFrequency = process.env.BOT_FREQUENCY;
const mainTab = "Repost Master";

async function getSheetData() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${mainTab}!A2:Z`,
    });

    let allGroupTabs = {};
    let allPostsData = [];

    const rows = res.data.values;

    for (const row of rows) {
      const postUrl = row[2];
      const groupTabs = row.slice(4);
      const frequency = row[1];

      if (frequency !== botFrequency) continue;

      for (const tab of groupTabs) {
        if (tab.trim() === "" || tab.trim() === "-") continue;

        if (!allGroupTabs[tab]) {
          const groupNames = await getGroupNamesFromTabName(spreadsheetId, tab);

          allGroupTabs[tab] = groupNames;
        }

        allPostsData.push({
          postUrl,
          groupNames: allGroupTabs[tab],
        });
      }
    }

    // console.log("allPostsData", allPostsData);

    return allPostsData;
  } catch (err) {
    console.error("Error fetching data from Google Sheets:", err.message);
  }
}

async function getGroupNamesFromTabName(spreadsheetId, tab) {
  const tabRes = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `'${tab}'!A1:Z`,
  });

  const tabRows = tabRes.data.values;
  const tabColumns = transpose(tabRows);
  const groupNames = tabColumns[0].slice(1);

  return groupNames;
}

function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

module.exports = { getSheetData };
