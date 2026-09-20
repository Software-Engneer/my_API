import mongoose from 'mongoose';

const fixtureSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'live', 'finished'], default: 'upcoming' },
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
});

const resultSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  date: { type: String, required: true },
  homeScore: { type: Number, required: true },
  awayScore: { type: Number, required: true },
  venue: { type: String, required: true },
  competition: { type: String, required: true },
});

const standingSchema = new mongoose.Schema({
  position: { type: Number, required: true },
  team: { type: String, required: true },
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  gf: { type: Number, default: 0 },
  ga: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
});

const sportsNewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  author: { type: String, default: 'Kwathu Sports' },
  publishedAt: { type: Date, default: Date.now },
});

const leagueSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    season: { type: String, default: '2026 Season' },
    teams: [{ type: String }],
    fixtures: [fixtureSchema],
    results: [resultSchema],
    standings: [standingSchema],
    news: [sportsNewsSchema],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

leagueSchema.index({ key: 1 }, { unique: true });

const League = mongoose.model('League', leagueSchema);

export default League;