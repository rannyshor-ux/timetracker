# מערכת ניהול שעות עבודה

אפליקציית Web לניהול שעות עבודה, פרויקטים ומשימות לחברות ומשרדים קטנים.

בנויה עם **Next.js**, **Prisma**, **SQLite** ו-**Tailwind CSS**.

---

## תכולת המערכת

- ניהול עובדים (הוספה, עריכה, מחיקה)
- ניהול פרויקטים
- רישום שעות עבודה יומיות
- דף משימות עם עדיפויות, סטטוסים וארכיון
- לוח בקרה עם סיכום שעות שבועי לפי עובד
- יצוא לקובץ Excel
- ממשק בעברית (RTL)
- שתי רמות הרשאה: מנהל (ADMIN) ועובד (EMPLOYEE)

---

## דרישות מקדימות

- [Node.js](https://nodejs.org) גרסה 18 ומעלה
- npm (מגיע עם Node.js)
- חשבון [GitHub](https://github.com) (לסנכרון ופריסה)

---

## התקנה מקומית

### 1. קבלת הקוד

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>/timesheet-app
```

### 2. התקנת חבילות

```bash
npm install
```

### 3. הגדרת משתני סביבה

צור קובץ `.env` בתוך תיקיית `timesheet-app`:

```env
JWT_SECRET=הכנס-כאן-מחרוזת-סודית-ארוכה-ואקראית
```

> **חשוב:** ה-`JWT_SECRET` יכול להיות כל מחרוזת ארוכה ואקראית. לדוגמה:
> `JWT_SECRET=my-super-secret-key-2024-timesheet-app`

### 4. יצירת מסד הנתונים

```bash
npx prisma migrate deploy
```

### 5. הרצת האפליקציה

```bash
npm run dev
```

כנס לכתובת: [http://localhost:3000](http://localhost:3000)

---

## כניסה ראשונה

בגישה הראשונה לאפליקציה, המערכת תאפשר רישום משתמש מנהל ראשוני.

לאחר מכן ניתן להוסיף עובדים נוספים מתוך ממשק הניהול.

---

## התאמה אישית

### לוגו ושם העסק

ערוך את הקובץ `src/app/layout.tsx`:

```tsx
// שנה את שם האפליקציה
<title>שם העסק שלך</title>
```

ואת `src/app/page.tsx` לשינוי הכותרת בלוח הבקרה.

### צבעים ועיצוב

הצבעים מוגדרים באמצעות Tailwind CSS ישירות בקבצי `.tsx`.
ניתן לשנות צבעים, גדלי טקסט ועיצוב בכל קובץ בתיקיית `src/`.

### שפה

כל הטקסטים נמצאים ישירות בקבצי ה-`.tsx` תחת `src/app/`.

---

## פריסה לאינטרנט (Railway)

### 1. צור חשבון ב-Railway

היכנס ל-[railway.app](https://railway.app) והירשם עם GitHub.

### 2. פרויקט חדש

- לחץ **New Project**
- בחר **Deploy from GitHub repo**
- בחר את ה-repository שלך

### 3. הגדרת משתני סביבה

בלשונית **Variables** הוסף:

```
JWT_SECRET=הכנס-כאן-מחרוזת-סודית
```

### 4. הגדרת Root Directory

בלשונית **Settings** → **Root Directory** הכנס:

```
timesheet-app
```

### 5. פריסה אוטומטית

מעתה כל `git push` יגרום לפריסה אוטומטית של הגרסה החדשה.

---

## מבנה הפרויקט

```
timesheet-app/
├── prisma/
│   ├── schema.prisma        # הגדרת מסד הנתונים
│   ├── migrations/          # היסטוריית שינויים במסד
│   └── dev.db               # קובץ מסד הנתונים (SQLite)
├── src/
│   └── app/
│       ├── api/             # API routes
│       │   ├── auth/
│       │   ├── employees/
│       │   ├── projects/
│       │   ├── tasks/
│       │   └── timeentries/
│       ├── dashboard/
│       ├── employees/
│       ├── projects/
│       ├── tasks/           # דף משימות
│       ├── timesheets/
│       ├── layout.tsx       # תבנית ראשית + ניווט
│       └── page.tsx         # לוח בקרה
├── .env                     # משתני סביבה (לא בגיט!)
├── package.json
└── README.md
```

---

## פקודות שימושיות

```bash
# הרצה בסביבת פיתוח
npm run dev

# בנייה לייצור
npm run build

# הרצה בסביבת ייצור
npm start

# פתיחת ממשק Prisma לצפייה במסד הנתונים
npx prisma studio
```

---

## שאלות נפוצות

**שכחתי את הסיסמה של המנהל** — כרגע אין מנגנון שחזור סיסמה. ניתן לאפס דרך Prisma Studio:
```bash
npx prisma studio
```
ולעדכן ישירות את שדה ה-`password` (יש להשתמש בסיסמה מוצפנת bcrypt).

**האפליקציה לא עולה** — ודא שקובץ `.env` קיים ושהרצת `npx prisma migrate deploy`.

**שינויים לא מופיעים ב-Railway** — ודא שדחפת את השינויים ל-GitHub (`git push`).
