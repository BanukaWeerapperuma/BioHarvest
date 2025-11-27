import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import User from '../models/userModel.js';
import PDFDocument from 'pdfkit';

// Enroll in a course
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Check if course exists and is active
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Course is not active'
      });
    }

    if (course.isFull) {
      return res.status(400).json({
        success: false,
        message: 'Course is full'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: userId,
      course: courseId,
      payment: {
        amount: course.isFree ? 0 : course.discountedPrice,
        status: course.isFree ? 'completed' : 'pending'
      }
    });

    await enrollment.save();

    // Increment course enrollment count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledStudents: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course',
      error: error.message
    });
  }
};

// Get user's enrollments
export const getUserEnrollments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const enrollments = await Enrollment.find({ student: userId })
      .populate('course')
      .sort({ enrollmentDate: -1 });

    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// Get enrollment details
export const getEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.userId;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: userId
    }).populate('course');

    if (!enrollment) {
      // Return dummy data for development if no enrollment is found
      const dummyCourse = {
        _id: 'dummycourseid',
        title: 'Modern Web Development',
        description: 'Learn the latest in web development with hands-on projects and expert instruction.',
        category: 'cooking',
        level: 'intermediate',
        price: 99,
        discount: 20,
        isFree: false,
        duration: 30,
        image: '',
        instructor: {
          name: 'Dr. Sarah Johnson',
          title: 'Senior Software Engineer & Educator',
          avatar: 'default-avatar.jpg',
          bio: 'Expert in modern web development with extensive experience in React, Node.js, and cloud technologies.'
        },
        content: {
          sections: [
            {
              _id: 'section1',
              title: 'Introduction',
              description: 'Course overview and setup.',
              duration: 60,
              videos: [
                {
                  title: 'Welcome',
                  url: '',
                  duration: 10,
                  description: 'Welcome to the course!',
                  thumbnail: ''
                }
              ],
              assignments: [],
              quizzes: []
            },
            {
              _id: 'section2',
              title: 'Core Concepts',
              description: 'Learn the core concepts of web development.',
              duration: 120,
              videos: [],
              assignments: [],
              quizzes: []
            }
          ],
          timeline: [],
          certificate: {
            template: 'default',
            requirements: ['complete-all-sections'],
            validFor: 12
          }
        },
        tags: ['web', 'development', 'react'],
        requirements: ['Basic computer skills'],
        learningOutcomes: ['Build modern web apps', 'Understand React basics'],
        enrolledStudents: 1247,
        maxStudents: 2000,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(),
        enrollmentDeadline: new Date(),
        certificateTemplate: 'default',
        rating: 4.8,
        reviewCount: 89
      };
      const dummyEnrollment = {
        _id: 'dummyenrollmentid',
        student: userId,
        course: dummyCourse,
        enrollmentDate: new Date(),
        status: 'enrolled',
        progress: {
          completedSections: [],
          completedVideos: [],
          completedAssignments: [],
          completedQuizzes: [],
          attendedClasses: []
        },
        certificate: {
          issued: false,
          issuedAt: null,
          certificateId: '',
          downloadUrl: ''
        },
        payment: {
          amount: 79,
          currency: 'USD',
          paymentMethod: '',
          transactionId: '',
          status: 'completed'
        },
        notes: '',
        lastAccessed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return res.status(200).json({
        success: true,
        data: dummyEnrollment
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    console.error('Error fetching enrollment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollment details',
      error: error.message
    });
  }
};

// Update progress (mark section as completed)
export const updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { sectionId, score } = req.body;
    const userId = req.user.userId;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: userId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if section is already completed
    const existingCompletion = enrollment.progress.completedSections.find(
      section => String(section.sectionId) === String(sectionId)
    );

    if (existingCompletion) {
      return res.status(400).json({
        success: false,
        message: 'Section already completed'
      });
    }

    // Add section completion
    enrollment.progress.completedSections.push({
      sectionId,
      completedAt: new Date(),
      score: score || 0
    });

    // Update status to in-progress if not already
    if (enrollment.status === 'enrolled') {
      enrollment.status = 'in-progress';
    }

    // Check if course is completed
    const course = await Course.findById(enrollment.course);
    if (course && course.content && course.content.sections) {
      const totalSections = course.content.sections.length;
      const completedSections = enrollment.progress.completedSections.length;
      
      if (completedSections >= totalSections) {
        enrollment.status = 'completed';
      }
    }

    enrollment.lastAccessed = new Date();
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
};

// Mark video as watched
export const markVideoWatched = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { videoId, watchTime } = req.body;
    const userId = req.user.userId;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: userId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if video is already marked as watched
    const existingVideo = enrollment.progress.completedVideos.find(
      video => video.videoId === videoId
    );

    if (existingVideo) {
      // Update watch time if provided
      if (watchTime) {
        existingVideo.watchTime = watchTime;
      }
      existingVideo.watchedAt = new Date();
    } else {
      enrollment.progress.completedVideos.push({
        videoId,
        watchedAt: new Date(),
        watchTime: watchTime || 0
      });
    }

    enrollment.lastAccessed = new Date();
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Video marked as watched',
      data: enrollment
    });
  } catch (error) {
    console.error('Error marking video as watched:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking video as watched',
      error: error.message
    });
  }
};

// Submit assignment
export const submitAssignment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { assignmentId, submission } = req.body;
    const userId = req.user.userId;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: userId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if assignment is already submitted
    const existingSubmission = enrollment.progress.completedAssignments.find(
      assignment => String(assignment.assignmentId) === String(assignmentId)
    );

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Assignment already submitted'
      });
    }

    enrollment.progress.completedAssignments.push({
      assignmentId,
      submittedAt: new Date(),
      score: 0, // Will be updated by instructor
      feedback: ''
    });

    enrollment.lastAccessed = new Date();
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: enrollment
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting assignment',
      error: error.message
    });
  }
};

// Submit quiz
export const submitQuiz = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { quizId, answers } = req.body;
    const userId = req.user.userId;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: userId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if quiz is already completed
    const existingQuiz = enrollment.progress.completedQuizzes.find(
      quiz => String(quiz.quizId) === String(quizId)
    );

    if (existingQuiz) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already completed'
      });
    }

    // Get course to check quiz answers
    const course = await Course.findById(enrollment.course);
    const quiz = course.content.sections
      .flatMap(section => section.quizzes)
      .find(q => String(q._id) === String(quizId));

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    enrollment.progress.completedQuizzes.push({
      quizId,
      completedAt: new Date(),
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers
    });

    enrollment.lastAccessed = new Date();
    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        score,
        totalQuestions: quiz.questions.length,
        correctAnswers,
        passingScore: quiz.passingScore || 70
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz',
      error: error.message
    });
  }
};

// Generate certificate
export const generateCertificate = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.userId;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: userId
    }).populate(['course', 'student']);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (enrollment.certificate.issued) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already issued'
      });
    }

    // Check if student can receive certificate
    if (!enrollment.canReceiveCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate requirements not met'
      });
    }

    // Generate certificate ID
    const certificateId = `CERT-${String(enrollment.course._id).slice(-6)}-${String(enrollment.student._id).slice(-6)}-${Date.now()}`;

    // Update enrollment with certificate
    enrollment.certificate = {
      issued: true,
      issuedAt: new Date(),
      certificateId,
      downloadUrl: `/api/enrollments/${enrollmentId}/certificate/download`
    };

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: 'Certificate generated successfully',
      data: {
        certificateId,
        downloadUrl: enrollment.certificate.downloadUrl
      }
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate',
      error: error.message
    });
  }
};

// Download certificate
export const downloadCertificate = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.userId;

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: userId
    }).populate(['course', 'student']);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    if (!enrollment.certificate.issued) {
      return res.status(400).json({
        success: false,
        message: 'Certificate not issued'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${enrollment.certificate.certificateId}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Certificate design
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background color
    doc.rect(0, 0, pageWidth, pageHeight)
       .fillColor('#f8f9fa')
       .fill();

    // Border
    doc.strokeColor('#667eea')
       .lineWidth(10)
       .rect(20, 20, pageWidth - 40, pageHeight - 40)
       .stroke();

    // Title
    doc.fontSize(36)
       .fillColor('#667eea')
       .text('CERTIFICATE OF COMPLETION', pageWidth / 2, 100, {
         align: 'center',
         underline: false
       });

    // Subtitle
    doc.fontSize(18)
       .fillColor('#666')
       .text('This is to certify that', pageWidth / 2, 180, {
         align: 'center'
       });

    // Student name
    doc.fontSize(32)
       .fillColor('#333')
       .text(enrollment.student.name, pageWidth / 2, 220, {
         align: 'center',
         bold: true
       });

    // Course completion text
    doc.fontSize(16)
       .fillColor('#666')
       .text('has successfully completed the course', pageWidth / 2, 280, {
         align: 'center'
       });

    // Course name
    doc.fontSize(24)
       .fillColor('#667eea')
       .text(enrollment.course.title, pageWidth / 2, 320, {
         align: 'center',
         bold: true
       });

    // Instructor
    doc.fontSize(14)
       .fillColor('#666')
       .text(`Instructor: ${enrollment.course.instructor?.name || 'Course Instructor'}`, pageWidth / 2, 380, {
         align: 'center'
       });

    // Certificate ID
    doc.fontSize(12)
       .fillColor('#999')
       .text(`Certificate ID: ${enrollment.certificate.certificateId}`, pageWidth / 2, 420, {
         align: 'center'
       });

    // Date
    const completionDate = new Date(enrollment.certificate.issuedAt);
    const dateString = completionDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.fontSize(14)
       .fillColor('#666')
       .text(`Date of Completion: ${dateString}`, pageWidth / 2, 450, {
         align: 'center'
       });

    // Valid for
    const validFor = enrollment.course.content?.certificate?.validFor || 12;
    doc.fontSize(12)
       .fillColor('#999')
       .text(`Valid for ${validFor} months from date of issue`, pageWidth / 2, 480, {
         align: 'center'
       });

    // Signature line
    doc.moveTo(pageWidth / 2 - 150, pageHeight - 100)
       .lineTo(pageWidth / 2 + 150, pageHeight - 100)
       .strokeColor('#333')
       .lineWidth(1)
       .stroke();

    doc.fontSize(12)
       .fillColor('#666')
       .text('Authorized Signature', pageWidth / 2, pageHeight - 90, {
         align: 'center'
       });

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading certificate',
      error: error.message
    });
  }
}; 
