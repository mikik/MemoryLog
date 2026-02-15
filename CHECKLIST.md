# Setup Checklist ✓

Use this checklist to track your progress setting up Family Memory Log.

## Backend Setup

- [ ] Node.js installed (v18+)
- [ ] PocketBase downloaded for your OS
- [ ] PocketBase running (`./pocketbase serve`)
- [ ] PocketBase admin account created
- [ ] Database schema imported (4 collections visible)
- [ ] Test LogBook created in admin panel

## App Setup

- [ ] Project dependencies installed (`npm install`)
- [ ] Local IP address identified
- [ ] `src/services/pocketbase.js` updated with correct IP
- [ ] Expo Go app installed on phone
- [ ] Phone and computer on same WiFi network

## First Test

- [ ] `npm start` runs successfully
- [ ] QR code appears
- [ ] Expo Go scans QR code
- [ ] App loads on phone
- [ ] Can sign up with test account
- [ ] Can create a LogBook
- [ ] Can select photos
- [ ] Can post a memory
- [ ] Memory appears in feed

## Next Steps

- [ ] Invite family member with invite code
- [ ] Test multi-user experience
- [ ] Customize app name/logo (optional)
- [ ] Plan for production hosting

## Production Deployment (Future)

- [ ] Choose hosting method (Cloudflare/Tailscale/VPS)
- [ ] Set up production server
- [ ] Configure SSL/HTTPS
- [ ] Update app with production URL
- [ ] Build app for distribution
- [ ] Share with family!

---

## Need Help?

### Common Issues

**"Cannot connect"**
- ✓ PocketBase is running
- ✓ IP address is correct
- ✓ Same WiFi network

**"Module not found"**
```bash
rm -rf node_modules
npm install
```

**"Schema import failed"**
- Check JSON syntax
- Try manual collection creation

### Resources

- README.md - Project overview
- QUICKSTART.md - Fast setup
- SETUP.md - Detailed guide
- PocketBase docs: https://pocketbase.io/docs/
- Expo docs: https://docs.expo.dev/

---

## Success! 🎉

When you can:
- ✅ Create memories
- ✅ See them in feed
- ✅ Switch LogBooks
- ✅ Invite family

You're ready to go! Start preserving those family memories! 📸❤️
