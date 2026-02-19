# DocNotify - Document Notification System

A premium, mobile-first web application designed to manage document registrations and automate SMS notifications. Built for speed, responsiveness, and a seamless user experience.

## 🚀 Features

### 📱 User-Facing
- **Responsive Registration**: A clean, card-based form optimized for mobile and desktop.
- **Micro-interactions**: Glassmorphic UI with smooth transitions and real-time validation.
- **Multilingual**: Toggle between **English** and **French** language support.
- **Theme Customization**: Support for both **Dark Mode** (default) and **Light Mode**.

### 🛠 Administrative Tools
- **Unified App Shell**: Responsive sidebar for desktop and bottom nav for mobile.
- **Real-time Statistics**: Instant overview of Total, Pending, and Ready registrations.
- **User Management**: Searchable and filterable table of all registered users.
- **Custom SMS Templates**: Define personalized messages using `[Name]` and `[DocType]` placeholders.
- **Selective Notifications**: Trigger SMS notifications individually for ready documents.
- **Prepaid Support**: Integration with **SMS.to Android SMS Gateway** to utilize personal SIM balances.
- **Data Export**: One-click **CSV export** for all registration records.

## 💻 Tech Stack

- **Frontend**: Vite, Vanilla JavaScript, CSS3 (Glassmorphism), Lucide Icons.
- **Backend**: Node.js, Express.
- **Database**: SQLite (via `sqlite3` and `sqlite` wrapper).
- **SMS Gateway**: [SMS.to](https://sms.to) API.

## 🛠 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/psycho237-prog/doc-notify-system.git
cd doc-notify-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=3000
SMSTO_API_KEY=your_api_key_here
SMSTO_SENDER_ID=DocNotify
SMSTO_WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Running the Application

**Option A: Quick Start (Recommended)**
Run both at once:
```bash
./start.sh
```

**Option B: Manual Start**
**Start the Backend:**
```bash
cd backend
node index.js
```
The API serves at `http://localhost:3000`.

**Start the Frontend:**
```bash
cd frontend
npm run dev
```
The application will be available at `http://localhost:5174`.

## 📁 Project Structure

```text
doc-notify-system/
├── backend/            # Express API & SQLite Database
│   ├── database.sqlite # Local database
│   ├── index.js        # Main server logic
│   └── smsService.js   # SMS.to integration
├── frontend/           # Vite + Vanilla JS UI
│   ├── index.html      # Registration page
│   ├── admin.html      # Dashboard page
│   ├── style.css       # Unified design system
│   ├── main.js         # Registration logic
│   ├── admin.js        # Dashboard logic
│   └── i18n.js         # Language & Theme management
└── README.md
```

## 📄 License
MIT

---
*Built with ❤️ for a seamless document collection experience.*
