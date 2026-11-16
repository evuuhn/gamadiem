# GAMADIEM — Personal Finance & Student Budget Dashboard

**GAMADIEM** is a retro pixel-art personal finance web application designed to help university students—particularly around Universitas Gadjah Mada (UGM)—track their remaining monthly balance, calculate a safe daily spending limit, log categorized expenses, analyze spending trends, and discover budget-friendly campus meals in one unified interface.

---

## 👥 Team & Members

- **Team Name:** DILF (Developer InLove with Framework)
- **Members & Responsibilities:**
  - **Evan Aditya Ramadhan Joenoes** — Lead Design System Initiator; UI/UX Design, Frontend & Core Logic for **Dashboard**
  - **Clay Ohain Sedana** — UI/UX Design & Frontend Development for **Food Recommendation Page & History Page**
  - **Rhesa Ibnu Wibowo** — UI/UX Design & Frontend Development for **Sign in & Sign up Page**
  - **Radin Muhammad Banyu Satrio Utomo** — UI/UX Design & Frontend Development for **Settings Page**

*(Each member designed and implemented the UI/UX and functionality of their respective assigned page while adhering to the shared GAMADIEM visual system.)*

---

## ✨ Website Overview & Key Features

GAMADIEM combines a high-contrast pixel-art desktop aesthetic with practical daily budgeting mechanics to help students avoid overspending before the end of their monthly cycle.

### Core Features:
1. **Budget & Cycle Configuration (`Settings`):**
   - Users can customize their financial baseline by entering their **Total Allowance**, **Rent for a Room**, **Electricity** bill, **Cycle Duration (days)**, and **Savings Target**.
   - Automatically deducts fixed expenses and savings goals to compute accurate daily spending allowances.
2. **Real-Time Financial Summary Cards (`Dashboard`):**
   - **Spendable Balance:** Displays the total remaining funds available for day-to-day spending after fixed costs and savings.
   - **Virtual Piggy Bank:** Tracks dedicated savings kept separate from spendable cash.
   - **Safe-to-Spend Today:** Dynamically calculates the recommended daily spending cap based on remaining spendable balance and remaining days in the cycle.
3. **Quick Expense Logger (`Dashboard`):**
   - Interactive expense form with **automatic thousand-separator formatting** as you type (`15000` -> `15.000`), interactive category selectors (**Food**, **Groceries**, **Transport**, **Social**) with hover/active visual feedback, and custom **notes**.
   - Submitting an entry automatically deducts the amount from **Spendable Balance**, recalculates **Safe-to-Spend Today**, and records the transaction into **Purchase History**.
4. **Interactive Scrollable Wishlist (`Dashboard`):**
   - Users can add target items and estimated prices directly to their **Wishlist** to prioritize purchases and curb impulse buying.
   - Includes a dedicated scrollable list container (`overflow-y: auto`) so adding numerous items keeps the dashboard layout compact and clean.
5. **Purchase History & Spending Analytics (`History`):**
   - **Summary Metrics:** Displays **Total Purchases**, total transaction/item count, and **Average Order** value.
   - **Past Items Log:** Lists previously purchased items grouped chronologically by the day they were bought.
   - **Spending Summary:** Shows the percentage increase or decrease in spending compared to the previous month.
   - **Top Spending Categories:** Breaks down spending distribution across the four core categories (**Food**, **Groceries**, **Transport**, and **Social**).
6. **Campus Dining Guide (`Food Recommendation Around UGM`):**
   - Curated list of food and dining recommendations around the UGM campus area to help students find convenient, budget-friendly meals.
7. **Authentication & Multi-Page Navigation (`Sign In / Sign Up`):**
   - Dedicated **Sign In** and **Sign Up** pages alongside unified sidebar navigation connecting **Dashboard**, **History**, **Food Recommendation**, and **Settings**.
8. **Persistent Client-Side Storage (`localStorage`):**
   - Balances, budget settings, transaction history, and wishlist items persist automatically across page reloads and navigation between pages.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Typography:** Google Fonts — [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans)
- **Storage:** Web Storage API (`localStorage`)
- **UI/UX Prototyping:** Figma
- **Development & Hosting:** Visual Studio Code, Live Server, GitHub / GitHub Pages

---

## 🚀 Installation & How to Run Locally

Because GAMADIEM is built with pure static web technologies (HTML/CSS/JS), no package manager or build step is required.

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/[your-github-username]/[gamadiem-repo-name].git
   cd [gamadiem-repo-name]
   ```

   *(Or extract the downloaded project `.zip` archive into a local folder.)*

2. **Open in Visual Studio Code:**
   - Launch VS Code, select **File > Open Folder...**, and open the `gamadiem-app` directory.

3. **Run with Live Server (Recommended):**
   - Install the **Live Server** extension in VS Code.
   - Open `index.html` and click **Go Live** in the bottom-right status bar (or right-click `index.html` -> **Open with Live Server**).
   - The app will open in your browser at `[http://127.0.0.1:5500/index.html](http://127.0.0.1:5500/index.html)`.

4. **Alternative (Direct Browser Open):**
   - Double-click `index.html` to open it directly in any modern browser (Chrome, Edge, Firefox).

---

## 🌐 Deployment Links

- **Live Website (GitHub Pages):** `https://[your-github-username].github.io/[gamadiem-repo-name]/` *(Update once GitHub Pages is enabled in Repository Settings > Pages)*
- **Figma Design File:** [GAMADIEM Web App Figma](https://www.figma.com/design/JBwmuhnLjpxPc8SfLFOqv4/Gamadiem-WEBAPPA?node-id=3-346&t=D7hCTkeSE7SCh87H-1)

---

## 🤖 AI Usage, Templates & Third-Party Assets Disclosure

In accordance with project transparency guidelines:
- **AI Tools Used:**
  - **Figma MCP Server & GitHub Copilot (VS Code):** Used to translate layout structures, color tokens, and typography from Figma frames into initial HTML/CSS scaffolding, as well as assist in writing JavaScript helpers (thousand-separator input formatting and `localStorage` state management). All generated code was reviewed, refactored, and tested manually by the team.
  - **Google Gemini:** Used for feature ideation, budgeting calculation logic (*Safe-to-Spend*), and documentation drafting.
- **Templates / Starter Code:** No pre-made website templates or CSS frameworks were used; all layouts and stylesheets were custom-built for GAMADIEM.
- **Third-Party Fonts & Assets:**
  - **Pixelify Sans** typeface loaded via [Google Fonts](https://fonts.google.com/).
  - Custom pixel-art icons and stickers were designed and exported directly from **Figma**.

---

## ⚠️ Additional Notes & Project Limitations

- **Client-Side Storage Only:** All financial figures, settings, history logs, and wishlist items are stored locally in the user's browser via `localStorage`. Clearing browser site data or switching devices/browsers will reset the data to its initial default state.
- **Resetting Demo Data:** To reset balances or clear test transactions back to a clean state, open **Browser DevTools (`F12`) -> Application -> Local Storage -> Clear**, then refresh the page.
- **Viewport Optimization:** The interface is designed primarily for desktop viewports (`1440x1024` and standard laptop screens) to display all financial summary cards, transaction inputs, and the wishlist simultaneously without vertical page scrolling.
