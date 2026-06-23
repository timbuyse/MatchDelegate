# Migratieplan: van single-admin naar multi-ploeg

## Wat verandert in de app

### 1. Authenticatie
**Nu:** één vaste admin-email in de code (`ADMIN_EMAIL`)
**Nieuw:** Firebase Auth voor iedereen — elke gebruiker logt in met eigen account

### 2. Opstartflow
**Nu:** app laadt meteen de data
**Nieuw:**
```
Inloggen
  → gebruiker heeft ploegen? → toon ploegenlijst
  → geen ploegen? → "Ploeg aanmaken" of "Ploeg vervoegen via code"
```

### 3. Data laden
**Nu:** `fbdb.ref('matches').on('value', ...)`
**Nieuw:** `fbdb.ref('teams/' + teamId + '/matches').on('value', ...)`

Alle bestaande `fbdb.ref('...')` calls krijgen `/teams/{teamId}/` als prefix.

### 4. Schrijfrechten
**Nu:** iedereen die het wachtwoord kent is admin
**Nieuw:** de database rules controleren automatisch of `members/{uid} === 'admin'`

### 5. Uitnodigingssysteem (nieuw)
```javascript
// Beheerder maakt uitnodiging aan
function createInvite(teamId) {
  const token = generateRandomToken(); // bv. 8 tekens willekeurig
  fbdb.ref('invites/' + token).set({
    teamId: teamId,
    createdBy: firebase.auth().currentUser.uid,
    createdAt: Date.now(),
  });
  return token; // toon als QR-code of deelbare link
}

// Nieuwe gebruiker vervoegt ploeg
async function joinTeam(token) {
  const snap = await fbdb.ref('invites/' + token).once('value');
  const invite = snap.val();
  if (!invite) { alert('Ongeldige code'); return; }
  
  const uid = firebase.auth().currentUser.uid;
  const teamId = invite.teamId;
  
  // Voeg toe als viewer
  await fbdb.ref('teams/' + teamId + '/members/' + uid).set('viewer');
  await fbdb.ref('users/' + uid + '/teams/' + teamId).set('viewer');
  
  // Laad de ploeg
  loadTeam(teamId);
}
```

## Volgorde van aanpak

1. **Firebase Auth activeren** voor alle gebruikers (nu: enkel admin)
2. **Registratiescherm** toevoegen (email + wachtwoord)
3. **Ploegenlijst** tonen na inloggen (op basis van `users/{uid}/teams`)
4. **Ploeg aanmaken** functie: schrijft naar `teams/{newId}/info` en voegt zichzelf toe als admin
5. **Data-paden aanpassen**: alle `fbdb.ref('matches/...')` → `fbdb.ref('teams/' + activeTeamId + '/matches/...')`
6. **Uitnodigingssysteem** bouwen
7. **Database rules** deployen

## Bestaande data migreren

De huidige data (`matches/`, `teams/`, `tournaments/`, `club/`) kan je eenmalig verplaatsen:
```javascript
// Eenmalig migratieScript (run als admin)
const bestaandeData = await fbdb.ref('/').once('value');
const teamId = fbdb.ref('teams').push().key; // nieuw uniek ID
await fbdb.ref('teams/' + teamId).set({
  info: { name: 'Mijn ploeg', createdBy: adminUid, createdAt: Date.now() },
  members: { [adminUid]: 'admin' },
  matches: bestaandeData.val().matches || {},
  roster: bestaandeData.val().teams || [],
  tournaments: bestaandeData.val().tournaments || {},
  club: bestaandeData.val().club || {},
});
```
