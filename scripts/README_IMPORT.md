CSV-Import für Berufsbilder
===========================

Erwartete Header (UTF-8, mit Header-Zeile):

slug,title,subtitle,excerpt,content,category,heroImageUrl,seoTitle,seoDescription,status

Hinweise:
- `slug` und `title` sind Pflicht.
- `status` ist optional (`DRAFT` oder `PUBLISHED`).
- `alphabeticalKey` wird automatisch aus dem ersten Zeichen von `title` berechnet.
- Zeilen ohne `slug`/`title` werden übersprungen.

Beispiel:

slug,title,subtitle,excerpt,content,category,heroImageUrl,seoTitle,seoDescription,status
medizinische-fachangestellte,Medizinische Fachangestellte,MFA,"Kurzbeschreibung...","<p>HTML-Inhalt...</p>",Gesundheit,https://.../mfa.jpg,"SEO Titel","SEO Beschreibung",PUBLISHED

Ausführen:

npm run import:professions -- ./daten/berufe.csv

Vorraussetzungen:
- In `.env` muss `DATABASE_URL` auf die Neon-Postgres-Datenbank zeigen.
- Migrationen müssen angewendet sein (z. B. `npx prisma migrate deploy`).


