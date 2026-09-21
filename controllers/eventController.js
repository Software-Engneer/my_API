import Event from '../models/Event.js';
import { _createNotification as createNotification } from '../controllers/notificationController.js';

const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, organizer, category, image } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      organizer,
      category,
      image: image || 'https://images.unsplash.com/photo-1511632765486-a01980e01a2c?w=600&h=300&fit=crop',
      author: req.user._id,
    });

    const populatedEvent = await Event.findById(event._id).populate('author', 'fullName avatar');

    res.status(201).json({
      success: true,
      event: populatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getEvents = async (req, res) => {
  try {
    const { category, search, sort = 'date', page = 1, limit = 20 } = req.query;

    const query = { isPublished: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    let sortOption = { date: 1, time: 1 };
    if (sort === 'popular') sortOption = { attendees: -1, date: 1 };
    if (sort === 'createdAt') sortOption = { createdAt: -1 };

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('author', 'fullName avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: events.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('author', 'fullName avatar email');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found.',
      });
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, organizer, category, image, isPublished } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found.',
      });
    }

    if (event.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this event.',
      });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.venue = venue || event.venue;
    event.organizer = organizer || event.organizer;
    event.category = category || event.category;
    event.image = image || event.image;
    event.isPublished = isPublished !== undefined ? isPublished : event.isPublished;

    await event.save();

    const populatedEvent = await Event.findById(event._id).populate('author', 'fullName avatar');

    res.json({
      success: true,
      event: populatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found.',
      });
    }

    if (event.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this event.',
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const attendEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found.',
      });
    }

    event.attendees += 1;
    await event.save();

    // Create notification for event organizer
    if (!event.author.equals(req.user.id)) {
      await createNotification({
        user: event.author,
        type: 'event_attending',
        title: 'New Attendee',
        message: `${req.user.fullName} is attending your event "${event.title}"`,
        actor: req.user.id,
        entityType: 'Event',
        entityId: event._id,
      });
    }

    res.json({
      success: true,
      attendees: event.attendees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const shareEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found.',
      });
    }

    res.json({
      success: true,
      message: 'Share tracked',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  attendEvent,
  shareEvent,
};