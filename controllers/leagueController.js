import League from '../models/League.js';

const createLeague = async (req, res) => {
  try {
    const { key, name, description, season, teams, fixtures, results, standings, news } = req.body;

    const league = await League.create({
      key,
      name,
      description,
      season,
      teams: teams || [],
      fixtures: fixtures || [],
      results: results || [],
      standings: standings || [],
      news: news || [],
    });

    res.status(201).json({
      success: true,
      league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getLeagues = async (req, res) => {
  try {
    const { active } = req.query;
    const query = active !== undefined ? { isActive: active === 'true' } : {};

    const leagues = await League.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leagues.length,
      leagues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getLeagueByKey = async (req, res) => {
  try {
    const league = await League.findOne({ key: req.params.key });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found.',
      });
    }

    res.json({
      success: true,
      league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateLeague = async (req, res) => {
  try {
    const { name, description, season, teams, fixtures, results, standings, news, isActive } = req.body;

    const league = await League.findOne({ key: req.params.key });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found.',
      });
    }

    league.name = name || league.name;
    league.description = description || league.description;
    league.season = season || league.season;
    league.teams = teams || league.teams;
    league.fixtures = fixtures || league.fixtures;
    league.results = results || league.results;
    league.standings = standings || league.standings;
    league.news = news || league.news;
    league.isActive = isActive !== undefined ? isActive : league.isActive;

    await league.save();

    res.json({
      success: true,
      league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteLeague = async (req, res) => {
  try {
    const league = await League.findOne({ key: req.params.key });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found.',
      });
    }

    await league.deleteOne();

    res.json({
      success: true,
      message: 'League deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const addFixture = async (req, res) => {
  try {
    const league = await League.findOne({ key: req.params.key });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found.',
      });
    }

    league.fixtures.push(req.body);
    await league.save();

    res.json({
      success: true,
      league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateFixture = async (req, res) => {
  try {
    const league = await League.findOne({ key: req.params.key });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found.',
      });
    }

    const fixtureIndex = league.fixtures.findIndex(f => f._id.toString() === req.params.fixtureId);
    if (fixtureIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Fixture not found.',
      });
    }

    league.fixtures[fixtureIndex] = { ...league.fixtures[fixtureIndex].toObject(), ...req.body };
    await league.save();

    res.json({
      success: true,
      league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const addResult = async (req, res) => {
  try {
    const league = await League.findOne({ key: req.params.key });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found.',
      });
    }

    league.results.push(req.body);
    await league.save();

    res.json({
      success: true,
      league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const addStanding = async (req, res) => {
  try {
    const league = await League.findOne({ key: req.params.key });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found.',
      });
    }

    league.standings.push(req.body);
    await league.save();

    res.json({
      success: true,
      league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const addNews = async (req, res) => {
  try {
    const league = await League.findOne({ key: req.params.key });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found.',
      });
    }

    league.news.push({ ...req.body, publishedAt: new Date() });
    await league.save();

    res.json({
      success: true,
      league,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export {
  createLeague,
  getLeagues,
  getLeagueByKey,
  updateLeague,
  deleteLeague,
  addFixture,
  updateFixture,
  addResult,
  addStanding,
  addNews,
};