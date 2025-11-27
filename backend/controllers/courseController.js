import Course from '../models/courseModel.js';
import { uploadFile, deleteFromCloudinary } from '../utils/cloudinary.js';

const normalizeFiles = (filesArray = []) => {
  if (!filesArray) return {};
  if (Array.isArray(filesArray)) {
    return filesArray.reduce((acc, file) => {
      if (!acc[file.fieldname]) {
        acc[file.fieldname] = [];
      }
      acc[file.fieldname].push(file);
      return acc;
    }, {});
  }
  return filesArray;
};

const uploadPdfFile = async (file) => {
  if (!file) return null;
  const pdfResult = await uploadFile(file, 'courses/pdfs', 'raw');
  return {
    url: pdfResult.url,
    publicId: pdfResult.public_id,
    originalName: file.originalname,
    format: pdfResult.format,
    bytes: pdfResult.bytes,
    uploadDate: new Date()
  };
};

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered === 'true') return true;
    if (lowered === 'false') return false;
  }
  return defaultValue;
};

const parseNumber = (value, fallback = 0) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

// Get all courses (public)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// Get course by ID (public)
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
};

// Admin: Get all courses (including inactive)
export const adminGetAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// Helper function to process course sections with topics
const processCourseSections = async (sections, filesMap = {}) => {
  if (!sections || !Array.isArray(sections)) return [];

  return await Promise.all(sections.map(async (section, sectionIndex) => {
    const sectionTopics = Array.isArray(section.topics) ? section.topics : [];

    const processedTopics = await Promise.all(sectionTopics.map(async (topic, topicIndex) => {
      const pdfFileKey = `pdf_${sectionIndex}_${topicIndex}`;
      let pdfFileData = topic?.content?.pdfFile || null;

      if (filesMap[pdfFileKey] && filesMap[pdfFileKey][0]) {
        pdfFileData = await uploadPdfFile(filesMap[pdfFileKey][0]);
      }

      const topicContent = topic.content || {};

      return {
        ...topic,
        content: {
          ...topicContent,
          pdfFile: pdfFileData
        }
      };
    }));

    return {
      ...section,
      topics: processedTopics
    };
  }));
};

// Admin: Add new course
export const addCourse = async (req, res) => {
  try {
    const files = normalizeFiles(req.files);
    const {
      title,
      description,
      category,
      level,
      price,
      discount,
      isFree,
      duration,
      instructor,
      content,
      tags,
      requirements,
      learningOutcomes,
      sections
    } = req.body;

    if (!files.image || !files.image[0]) {
      return res.status(400).json({
        success: false,
        message: 'Course image is required'
      });
    }

    const uploadedImage = await uploadFile(files.image[0], 'courses/images');

    // Parse JSON strings if they exist and provide defaults
    const parsedInstructor = instructor ? JSON.parse(instructor) : {};
    const parsedContent = content ? JSON.parse(content) : { sections: [] };
    const parsedTags = tags ? JSON.parse(tags) : [];
    const parsedRequirements = requirements ? JSON.parse(requirements) : [];
    const parsedLearningOutcomes = learningOutcomes ? JSON.parse(learningOutcomes) : [];
    const parsedSections = sections ? JSON.parse(sections) : parsedContent.sections || [];

    let avatarUrl = parsedInstructor.avatar || 'default-avatar.jpg';
    let avatarPublicId = parsedInstructor.avatarPublicId || '';

    if (files.avatar && files.avatar[0]) {
      const uploadedAvatar = await uploadFile(files.avatar[0], 'courses/avatars');
      avatarUrl = uploadedAvatar.url;
      avatarPublicId = uploadedAvatar.public_id;
    }

    // Process sections with topics and handle PDF file uploads
    const processedSections = await processCourseSections(parsedSections, files);

    // Ensure instructor has all required fields with defaults
    const instructorData = {
      name: parsedInstructor.name || 'Instructor Name',
      title: parsedInstructor.title || 'Course Instructor',
      avatar: avatarUrl,
      avatarPublicId,
      bio: parsedInstructor.bio || 'Experienced instructor with expertise in this field.'
    };

    const course = new Course({
      title,
      description,
      category,
      level,
      price: parseBoolean(isFree) ? 0 : parseNumber(price, 0),
      discount: parseBoolean(isFree) ? 0 : parseNumber(discount, 0),
      isFree: parseBoolean(isFree),
      duration: parseInt(duration) || 0,
      image: uploadedImage.url,
      imagePublicId: uploadedImage.public_id,
      instructor: instructorData,
      content: {
        ...parsedContent,
        sections: processedSections
      },
      tags: parsedTags,
      requirements: parsedRequirements,
      learningOutcomes: parsedLearningOutcomes
    });

    const savedCourse = await course.save();
    res.status(201).json({
      success: true,
      message: 'Course added successfully',
      data: savedCourse
    });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding course',
      error: error.message
    });
  }
};

// Admin: Update course
export const updateCourse = async (req, res) => {
  try {
    const files = normalizeFiles(req.files);
    const {
      title,
      description,
      category,
      level,
      price,
      discount,
      isFree,
      duration,
      instructor,
      content,
      tags,
      requirements,
      learningOutcomes,
      isActive
    } = req.body;

    // Parse JSON strings if they exist
    const parsedInstructor = instructor ? JSON.parse(instructor) : {};
    const parsedContent = content ? JSON.parse(content) : { sections: [] };
    const parsedTags = tags ? JSON.parse(tags) : [];
    const parsedRequirements = requirements ? JSON.parse(requirements) : [];
    const parsedLearningOutcomes = learningOutcomes ? JSON.parse(learningOutcomes) : [];

    // Get current course to preserve existing data
    const currentCourse = await Course.findById(req.params.id);
    if (!currentCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    let image = currentCourse.image;
    let imagePublicId = currentCourse.imagePublicId;
    if (files.image && files.image[0]) {
      const uploadedImage = await uploadFile(files.image[0], 'courses/images');
      image = uploadedImage.url;
      if (currentCourse.imagePublicId) {
        await deleteFromCloudinary(currentCourse.imagePublicId, 'image');
      }
      imagePublicId = uploadedImage.public_id;
    }

    let avatar = currentCourse?.instructor?.avatar || 'default-avatar.jpg';
    let avatarPublicId = currentCourse?.instructor?.avatarPublicId || '';

    if (files.avatar && files.avatar[0]) {
      const uploadedAvatar = await uploadFile(files.avatar[0], 'courses/avatars');
      avatar = uploadedAvatar.url;
      avatarPublicId = uploadedAvatar.public_id;

      if (currentCourse?.instructor?.avatarPublicId) {
        await deleteFromCloudinary(currentCourse.instructor.avatarPublicId, 'image');
      }
    }

    // Process course content sections and handle PDF uploads
    const processedContent = await processCourseSections(parsedContent.sections || [], files);

    // Ensure instructor has all required fields with defaults
    const instructorData = {
      name: parsedInstructor.name || 'Instructor Name',
      title: parsedInstructor.title || 'Course Instructor',
      avatar,
      avatarPublicId,
      bio: parsedInstructor.bio || 'Experienced instructor with expertise in this field.'
    };

    const updateData = {
      title,
      description,
      category,
      level,
      price: parseBoolean(isFree) ? 0 : parseNumber(price, 0),
      discount: parseBoolean(isFree) ? 0 : parseNumber(discount, 0),
      isFree: parseBoolean(isFree, currentCourse.isFree),
      duration: parseInt(duration) || currentCourse.duration,
      image,
      imagePublicId,
      instructor: instructorData,
      content: {
        ...parsedContent,
        sections: processedContent
      },
      tags: parsedTags,
      requirements: parsedRequirements,
      learningOutcomes: parsedLearningOutcomes,
      isActive: typeof isActive !== 'undefined' ? parseBoolean(isActive) : currentCourse.isActive
    };

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
};

// Admin: Delete course
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete image from Cloudinary
    if (course.imagePublicId) {
      await deleteFromCloudinary(course.imagePublicId, 'image');
    }

    // Delete avatar if stored in Cloudinary
    if (course.instructor?.avatarPublicId) {
      await deleteFromCloudinary(course.instructor.avatarPublicId, 'image');
    }

    // Delete PDFs from Cloudinary
    const pdfDeletionPromises = [];
    course.content?.sections?.forEach(section => {
      section?.topics?.forEach(topic => {
        const pdfId = topic?.content?.pdfFile?.publicId;
        if (pdfId) {
          pdfDeletionPromises.push(deleteFromCloudinary(pdfId, 'raw'));
        }
      });
    });

    if (pdfDeletionPromises.length > 0) {
      await Promise.all(pdfDeletionPromises);
    }

    await Course.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
};

// Admin: Toggle course status
export const toggleCourseStatus = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.isActive = !course.isActive;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.isActive ? 'activated' : 'deactivated'} successfully`,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling course status',
      error: error.message
    });
  }
};

// Get courses by category
export const getCoursesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const courses = await Course.find({ 
      category, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses by category',
      error: error.message
    });
  }
};

// Search courses
export const searchCourses = async (req, res) => {
  try {
    const { q } = req.query;
    const courses = await Course.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { tags: { $in: [new RegExp(q, 'i')] } }
          ]
        }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching courses',
      error: error.message
    });
  }
};

// Increment enrolled students (called when user enrolls)
export const incrementEnrollment = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $inc: { enrolledStudents: 1 } },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment incremented successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error incrementing enrollment',
      error: error.message
    });
  }
}; 