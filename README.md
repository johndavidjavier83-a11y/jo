# JD Academic Portfolio

A responsive HTML/CSS/JavaScript academic portfolio using Firebase for secure owner-only management.

## Features
- Home and About Me
- Quiz
- Long Quiz
- Midterms
- Finals
- Activities
- Projects
- Image and document uploads
- Public view/download access
- Owner-only upload/delete access
- Responsive dark blue/black animated design

## Firebase setup

1. Go to Firebase Console and create a project.
2. Add a Web App.
3. Copy the Firebase configuration into `script.js`.
4. Enable Authentication > Sign-in method > Email/Password.
5. Create your owner email/password under Authentication > Users.
6. Set `OWNER_EMAIL` in `script.js` to the same owner email.
7. Replace `your-owner-email@example.com` in BOTH `firestore.rules` and `storage.rules` with the same owner email.
8. Create Firestore Database.
9. Create Storage.
10. Publish the rules from the Firebase Console.
11. Upload this project to GitHub Pages or another static host.

## Important security note

Do not try to secure owner access by hiding buttons with JavaScript alone. The Firebase Firestore and Storage rules are the real access control. Visitors can read/download files because this is intentional. Only the configured owner email can create, edit, or delete records/files.

## Profile picture

Put your photo at:
`images/profile.jpg`

The homepage automatically displays it.

## GitHub Pages

Upload all files to a GitHub repository. In:
Settings > Pages > Deploy from branch > main > /root

Your portfolio will then be publicly viewable.


## Simple Owner Login

Default credentials:
- Username: `admin`
- Password: `JDPortfolio2026`

Change them in `script.js` using `OWNER_USERNAME` and `OWNER_PASSWORD`.

This simple login is for school/demo use. It is not secure production authentication because credentials are present in the JavaScript source. For a truly secure public site, use Firebase Authentication.
