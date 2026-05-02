const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'frontend--/src/pages/admin/Students.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Step 1: Replace the Firebase user creation with backend API call
const oldCreateCode = `        // CREATE OPERATION
        console.log('[STUDENT] Creating new student account:', normalizedEmail);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, normalizedPassword);
        const uid = userCredential.user.uid;
        console.log('[STUDENT] Firebase Auth created, UID:', uid);`;

const newCreateCode = `        // CREATE OPERATION
        console.log('[STUDENT] Creating new student account:', normalizedEmail);
        const createResponse = await fetch(\`\${API_BASE_URL}/api/auth/create-student\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: normalizedName,
            email: normalizedEmail,
            password: normalizedPassword,
            ...cleanedDataToSave,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.message || 'Failed to create student user');
        }

        const { uid } = await createResponse.json();
        console.log('[STUDENT] Backend created user with UID:', uid);`;

content = content.replace(oldCreateCode, newCreateCode);

// Step 2: Remove the Firestore setDoc line since backend handles it
const oldFirestoreCode = `        console.log('[STUDENT] Saving Firestore user document');
        await setDoc(doc(db, 'users', uid), userData);
        
        console.log('[STUDENT'] Adding to student database');`;

const newFirestoreCode = `        console.log('[STUDENT] Backend already created Firestore records');`;

content = content.replace(oldFirestoreCode, newFirestoreCode);

// Step 3: Remove the unused Firebase imports
content = content.replace(
  `import { createUserWithEmailAndPassword, getAuth as getAuthFromApp } from 'firebase/auth';\nimport { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';\nimport { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';`,
  `import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';`
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf-8');
console.log('✓ Students.tsx updated successfully');
