# Firebase Multi-Ploeg Structuur

## Realtime Database structuur

```
/teams/
  {teamId}/
    info/
      name: "U15 Rood"
      sport: "voetbal"
      createdBy: "{userId}"
      createdAt: 1719100000000
      inviteToken: "abc123xyz"        ← unieke uitnodigingscode voor deze ploeg

    members/
      {userId}: "admin"               ← beheerder
      {userId}: "viewer"              ← ouder / volger

    club/
      name: "FC Voorbeeld"
      logo: "..."

    roster/                           ← huidige spelerlijst (was: teams/ op root)
      {rosterId}/
        name: "U15 Rood"
        players: [ ... ]
        trainers: [ ... ]

    matches/                          ← was: matches/ op root
      {matchId}/
        opponent: "..."
        date: "..."
        score: { us: 2, them: 1 }
        events: [ ... ]
        players: [ ... ]
        quarters: [ ... ]
        ...

    tournaments/                      ← was: tournaments/ op root
      {tournamentId}/
        name: "Lentetornooi"
        ...

/users/
  {userId}/
    email: "jan@example.com"
    displayName: "Jan Peeters"
    teams/
      {teamId}: "admin"               ← rol per ploeg
      {teamId}: "viewer"

/invites/
  {token}/                            ← token = inviteToken uit team info
    teamId: "{teamId}"
    createdBy: "{userId}"
    createdAt: 1719100000000
    expiresAt: 1719700000000          ← optioneel: vervaldatum
```

## Uitleg

### teams/{teamId}
Elke ploeg heeft zijn eigen afgeschermde ruimte. Alle data (wedstrijden, spelers, tornoooien) staat onder die ploeg. Een beheerder die 2 ploegen beheert, heeft 2 aparte nodes.

### teams/{teamId}/members
Lijst van wie toegang heeft tot de ploeg, met hun rol:
- `admin` → kan alles lezen en schrijven
- `viewer` → kan alleen lezen

### users/{userId}/teams
Omgekeerde index: per gebruiker bijhouden tot welke ploegen ze toegang hebben, zodat de app snel kan laden welke ploegen iemand ziet bij het inloggen.

### invites/{token}
Wanneer een beheerder een uitnodiging aanmaakt, wordt hier een token opgeslagen. De uitnodigingslink bevat dat token:
`https://jouwapp.com/#join/abc123xyz`

Wanneer een nieuwe gebruiker die link opent:
1. App leest `/invites/abc123xyz` → vindt teamId
2. Gebruiker registreert of logt in
3. App schrijft gebruiker toe aan `/teams/{teamId}/members/{userId}: "viewer"`
4. App schrijft ook `/users/{userId}/teams/{teamId}: "viewer"`
