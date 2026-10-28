# 🍔 SkipQ - Smart Canteen Ordering System

**SkipQ** is a full-stack, real-time canteen management and food ordering system designed for colleges. It allows students to order food online and receive live notifications when their food is being prepared or is ready for pickup, eliminating long waiting queues.

## 🚀 Features

### 👨‍🎓 For Students (User App)
* **Multi-Canteen Support:** Browse menus from different canteens across the campus.
* **Live Order Tracking:** Receive real-time push notifications via WebSockets (`Socket.IO`) when the canteen confirms, prepares, or readies the order.
* **Secure Checkout:** Generate a unique Pickup Code for each order.
* **Order History & Notifications:** View past orders and receive in-app alerts.

### 👨‍🍳 For Canteen Staff (Staff App)
* **Live Order Dashboard:** Hear a "ding" and see new orders pop up instantly without refreshing the page.
* **Order Management:** Update order statuses (Confirm → Preparing → Ready → Picked Up).
* **Menu Manager:** Add new food items, change prices, mark items as unavailable, or delete them.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), React Router, Tailwind CSS, Socket.IO Client, Axios.
* **Backend:** Node.js, Express.js, Socket.IO (in-memory adapter for local dev), JWT (Authentication).
* **Database:** MySQL 8 (using `mysql2` with raw, parameterized SQL queries).

---

## 📂 Project Structure

```text
skipq/
├── db/                     # SQL schema and seed files
│   ├── schema.sql
│   └── seed.sql
├── services/
│   ├── api/                # Node.js Express Backend
│   ├── web-user/           # React Frontend (Port 5173) - For Students
│   └── web-canteen/        # React Frontend (Port 5174) - For Staff
└── README.md
