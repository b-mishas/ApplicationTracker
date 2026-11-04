// Synthetic fixtures: tests never need access to the user's job inventory.
export function fixtureData() {
  return {schemaVersion: 1, jobs: Array.from({length: 8}, (_, i) => ({
    id: `fixture-${i}`, company: `Fixture Company ${i}`, title: `Fixture Role ${i}`,
    fit: 3, group: 'Protein discovery', countries: ['DE'], country: 'DE', city: 'Berlin',
    locationRaw: 'Berlin, Germany', workMode: 'Hybrid', workModeRaw: 'Hybrid in Berlin',
    seniority: '', postedDate: '', firstSeen: '2026-11-02', assessmentBasis: 'Posting reviewed',
    availability: 'Unverified', url: `https://fixture.example/jobs/${i}`, linkType: 'posting',
    reasoning: '', gaps: '', status: 'New', notes: '',
    sources: [{label: 'Fixture', url: `https://fixture.example/jobs/${i}`, file: 'fixture.json'}]
  }))};
}
