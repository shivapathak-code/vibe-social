# 🚀 Vibe Social

A modern full-stack social media web application built with **HTML, CSS, JavaScript, Node.js, Express.js, MongoDB Atlas, and Socket.IO**. Vibe Social enables users to connect, share posts, interact through likes and comments, follow other users, and receive real-time notifications in a clean, responsive interface.

## 🌐 Live Demo

**Live Application:** [(https://vibe-social-te4g.onrender.com)](https://vibe-social-te4g.onrender.com)

## 📂 GitHub Repository

**Repository:** https://github.com/shivapathak-code/vibe-social

---

## ✨ Features

* 🔐 Secure JWT Authentication
* 👤 User Registration & Login
* 📝 Create, Edit & Delete Posts
* 🖼️ Image Upload Support
* ❤️ Like & Unlike Posts
* 💬 Comment System
* 👥 Follow & Unfollow Users
* 🔔 Real-time Notifications using Socket.IO
* 🔍 User Search
* 🌙 Dark & Light Theme
* 📱 Fully Responsive Design
* ☁️ MongoDB Atlas Cloud Database
* 🚀 Production Deployment on Render

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6)

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Authentication & Security

* JSON Web Token (JWT)
* bcrypt.js
* Helmet
* Express Validator

### Real-Time Communication

* Socket.IO

### Deployment

* Render

---

## 📁 Project Structure

```text
vibe-social/
├── client/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── feed.html
│   ├── profile.html
│   ├── search.html
│   ├── settings.html
│   ├── manifest.json
│   └── sw.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/shivapathak-code/vibe-social.git
cd vibe-social
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
NODE_ENV=development
CLIENT_URL=http://localhost:5000
```

### 4. Seed the Database (Optional)

```bash
npm run seed
```

### 5. Run the Application

```bash
npm run dev
```

Open:

```
http://localhost:5000
```

---

## 📸 Screenshots

Add screenshots inside a `screenshots` folder.

```
screenshots/
├── login.png
├── register.png
├── feed.png
├── profile.png
└── search.png
```

Example:

```markdown
![Feed](screenshots/feed.png)
```

---

## 🔒 Security Features

* Password Hashing with bcrypt
* JWT Authentication
* Protected Routes
* Input Validation
* Secure HTTP Cookies
* Helmet Security Middleware

---

## 🚀 Future Improvements

* Email Verification
* Password Reset via Email
* Cloudinary Image Storage
* Direct Messaging
* Story Feature
* Push Notifications
* Infinite Scrolling Feed
* User Blocking & Reporting

---

## 👨‍💻 Author

**Shiva Pathak**

GitHub: https://github.com/shivapathak-code

---

## ⭐ Support

If you found this project helpful, consider giving it a **⭐ Star** on GitHub.
