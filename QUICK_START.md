# Quick Start Guide - Multi-Timer Authentication

## 🚀 Getting Started in 5 Minutes

### Step 1: Start the Development Server
```bash
npm run dev
```

### Step 2: Access the App
Open your browser to [http://localhost:3000](http://localhost:3000)

You'll see the login/signup screen.

---

## 🆕 Creating Your Account

### For New Users

1. **Click "Sign up"** at the bottom of the form

2. **Fill in your details**:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@dappit.com`
   - Password: `securepass123` (minimum 6 characters)

3. **Click "Sign Up"**

4. You'll be automatically logged in and redirected to the timer dashboard!

---

## 🔐 Logging In

### For Existing Users

1. Enter your **email** and **password**

2. Click **"Login"**

3. You'll be redirected to the timer dashboard

---

## ✨ Using the Timer

Once logged in, you can:

### Start Tracking Time
1. Enter a task name (e.g., "Client Meeting")
2. Add notes (optional)
3. Click **START** button
4. The timer begins counting

### Switch Between Tasks
- Click **START** on another timer
- The current timer automatically stops
- Only one timer runs at a time

### View Your Daily Total
- See total time tracked at the top
- This is the sum of all your timers

### Organize by Project
- Click **"Add Project Group"** to create projects
- Add multiple timers per project
- Name your projects (e.g., "Client A", "Internal", etc.)

### Compact Mode
- Toggle compact mode for a cleaner view
- Click timer cards to start/stop
- Perfect when tracking many tasks

---

## 🔒 Security Features

### Your Data is Protected
- ✅ Passwords are encrypted (handled by Xano)
- ✅ JWT tokens for secure authentication
- ✅ Session persists across browser tabs
- ✅ Auto-logout on token expiry

### Logging Out
Click the **"Logout"** button in the navbar (top right)

---

## 💾 Data Persistence

### Timer Data Storage
Currently, your timer data is stored in your **browser's localStorage**:
- Timers persist across browser refreshes
- Data stays even if you close the browser
- Data is device-specific (not synced yet)

### Future: Cloud Sync
Soon, your timer data will sync to the cloud across all your devices!

---

## 🐛 Troubleshooting

### "Invalid email or password"
- Check your email is spelled correctly
- Passwords are case-sensitive
- Make sure Caps Lock is off

### "Session expired"
- Your login session has timed out
- Simply log in again
- Your timer data is still safe in localStorage

### Can't see the timer after login
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear your browser cache
- Check browser console for errors

### Timer data disappeared
- Check if you're logged in as the same user
- Timer data is currently per-browser
- If you cleared browser data, timers will be reset

---

## 📱 Browser Compatibility

### Recommended Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Not Recommended
- ❌ Internet Explorer (not supported)
- ❌ Very old browser versions

---

## 🎯 Next Steps

### Immediate Actions
1. Create your account
2. Start your first timer
3. Track some time!

### Coming Soon
- ☑️ Zoho Books integration for automatic time logging
- ☑️ Cloud sync across devices
- ☑️ Team collaboration features
- ☑️ Reporting and analytics

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Authentication Guide**: See `AUTHENTICATION_GUIDE.md`
- **Zoho Integration Plan**: See `ZOHO_INTEGRATION_ACTION_PLAN.md`

---

## 💡 Tips & Tricks

### Keyboard Shortcuts (Coming Soon)
Currently, use your mouse/trackpad to interact with timers.

### Best Practices
1. **Name your tasks clearly**: Use descriptive names like "Client A - Design Review"
2. **Use notes**: Add context to help with billing later
3. **Organize by project**: Group related timers together
4. **Check daily total**: Monitor your tracked time throughout the day

### Billing Workflow
1. Track time throughout the day
2. At end of day, review your timers
3. Note the task names and durations
4. Log hours to your billing system (manual for now)
5. Soon: One-click sync to Zoho Books!

---

## 🙋 Getting Help

### Have Questions?
- Check the `AUTHENTICATION_GUIDE.md` for detailed auth docs
- Review `README.md` for full feature documentation
- Contact Dappit support if issues persist

---

**Happy Time Tracking! ⏱️**
