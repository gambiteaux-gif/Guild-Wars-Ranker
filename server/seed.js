export const seedData = {
  players: [
    { id: 1, name: 'Liang Red Crane', role: 'DPS' },
    { id: 2, name: 'Mei Lanternheart', role: 'Healer' },
    { id: 3, name: 'Bao Iron Gate', role: 'Tank' },
    { id: 4, name: 'Shen River Fox', role: 'Jungler' },
    { id: 5, name: 'Yun Ash Saber', role: 'DPS' },
    { id: 6, name: 'Qiao Lotus Bell', role: 'Healer' },
    { id: 7, name: 'Ren Mountain Palm', role: 'Tank' },
    { id: 8, name: 'Tao Green Wisp', role: 'Jungler' }
  ],
  wars: [
    {
      id: 1,
      opponent: 'Moonlit Serpents',
      date: '2026-04-21',
      notes: 'Opening push won through south gate control.',
      stats: [
        { playerId: 1, role: 'DPS', kills: 28, assists: 13, deaths: 4, damage: 980000, healing: 12000, siegeDamage: 84000, funCoins: 18 },
        { playerId: 2, role: 'Healer', kills: 2, assists: 21, deaths: 3, damage: 110000, healing: 1020000, siegeDamage: 5000, funCoins: 12 },
        { playerId: 3, role: 'Tank', kills: 7, assists: 24, deaths: 2, damage: 390000, healing: 32000, siegeDamage: 12000, funCoins: 8 },
        { playerId: 4, role: 'Jungler', kills: 12, assists: 16, deaths: 3, damage: 470000, healing: 18000, siegeDamage: 54000, funCoins: 128 },
        { playerId: 5, role: 'DPS', kills: 19, assists: 10, deaths: 8, damage: 710000, healing: 9000, siegeDamage: 122000, funCoins: 16 }
      ]
    },
    {
      id: 2,
      opponent: 'Iron Rain Pavilion',
      date: '2026-04-28',
      notes: 'Defense-heavy war; jungler rotations decided mid-map pressure.',
      stats: [
        { playerId: 1, role: 'DPS', kills: 23, assists: 18, deaths: 5, damage: 890000, healing: 8000, siegeDamage: 74000, funCoins: 20 },
        { playerId: 2, role: 'Healer', kills: 1, assists: 17, deaths: 6, damage: 90000, healing: 820000, siegeDamage: 4000, funCoins: 8 },
        { playerId: 3, role: 'Tank', kills: 4, assists: 26, deaths: 1, damage: 310000, healing: 28000, siegeDamage: 8000, funCoins: 7 },
        { playerId: 4, role: 'Jungler', kills: 19, assists: 9, deaths: 7, damage: 620000, healing: 11000, siegeDamage: 48000, funCoins: 42 },
        { playerId: 6, role: 'Healer', kills: 0, assists: 20, deaths: 2, damage: 70000, healing: 940000, siegeDamage: 2000, funCoins: 11 },
        { playerId: 8, role: 'Jungler', kills: 9, assists: 18, deaths: 4, damage: 430000, healing: 20000, siegeDamage: 61000, funCoins: 136 }
      ]
    }
  ]
};
