# CareAIgent Website

Officiële website van het CareAIgent TETRA-project — PXL Zorginnovatie.

## Over het project

CareAIgent onderzoekt hoe bestaande AI-oplossingen de administratieve last voor zorgprofessionals concreet kunnen verlichten, via praktijkgericht onderzoek en co-creatie met zorginstellingen en technologiebedrijven.

**VLAIO TETRA-project · 2024–2026 · Hogeschool PXL**

## Projectstructuur

```
careaigent-website/
├── index.html        # Volledige website (single-page)
├── bedankt.html      # Bedanktpagina na contactformulier
├── netlify.toml      # Netlify configuratie + security headers
├── _redirects        # URL redirects voor Netlify
└── README.md         # Dit bestand
```

## Deployment via Netlify + GitHub

### 1. GitHub repository aanmaken

1. Ga naar [github.com/new](https://github.com/new)
2. Geef de repo een naam, bv. `careaigent-website`
3. Zet op **Private** of **Public** naar keuze
4. Klik **Create repository**

### 2. Bestanden uploaden naar GitHub

Via de GitHub-interface:
1. Klik **uploading an existing file**
2. Sleep alle bestanden uit deze map naar het uploadvenster
3. Klik **Commit changes**

Of via Git (terminal):
```bash
git init
git add .
git commit -m "Initial CareAIgent website"
git branch -M main
git remote add origin https://github.com/JOUW-USERNAME/careaigent-website.git
git push -u origin main
```

### 3. Netlify koppelen aan GitHub

1. Ga naar [app.netlify.com](https://app.netlify.com)
2. Klik **Add new site → Import an existing project**
3. Kies **Deploy with GitHub**
4. Selecteer de repository `careaigent-website`
5. Build settings:
   - **Base directory**: *(leeg laten)*
   - **Build command**: *(leeg laten)*
   - **Publish directory**: `.` of leeg
6. Klik **Deploy site**

### 4. Eigen domeinnaam (optioneel)

In Netlify → **Domain settings → Add custom domain**:
- Voeg `careaigent.be` toe
- Stel DNS in bij je domeinbeheerder (CNAME naar Netlify)

### 5. Contactformulier activeren

Na de eerste deploy:
1. Ga in Netlify naar **Site → Forms**
2. Het formulier "contact" staat er automatisch in
3. Ga naar **Form notifications → Add notification → Email notification**
4. Vul het e-mailadres in waar berichten naartoe moeten

## Contact

**Eric Lodewyckx** · Eric.Lodewyckx@PXL.BE  
Hogeschool PXL · Guffenslaan 39 · 3500 Hasselt
