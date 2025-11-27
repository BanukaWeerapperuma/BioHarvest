import mongoose from 'mongoose';
import Course from './models/courseModel.js';
import 'dotenv/config';

const sampleCourses = [
  {
    title: "Organic Farming Fundamentals",
    description: "Learn the basics of organic farming, soil health, and sustainable agriculture practices. Perfect for beginners who want to start their organic farming journey.",
    category: "organic",
    level: "beginner",
    price: 49.99,
    discount: 20,
    isFree: false,
    duration: 180, // 3 hours
    image: "organic-farming.jpg",
    instructor: {
      name: "Dr. Sarah Green",
      title: "Organic Agriculture Expert",
      avatar: "sarah-green.jpg",
      bio: "Dr. Sarah Green has over 15 years of experience in organic farming and sustainable agriculture. She holds a PhD in Agricultural Sciences and has helped thousands of farmers transition to organic methods."
    },
    content: {
      sections: [
        {
          title: "Introduction to Organic Farming",
          lessons: [
            {
              title: "What is Organic Farming?",
              duration: 15,
              type: "video",
              content: "Introduction to organic farming principles and benefits"
            },
            {
              title: "Soil Health Basics",
              duration: 20,
              type: "video",
              content: "Understanding soil composition and organic matter"
            }
          ]
        }
      ]
    },
    tags: ["organic", "farming", "sustainable", "soil"],
    requirements: ["No prior experience needed", "Basic gardening tools"],
    learningOutcomes: ["Understand organic farming principles", "Learn soil health management", "Master basic organic techniques"],
    enrolledStudents: 1250,
    rating: 4.8,
    reviewCount: 89
  },
  {
    title: "Sustainable Food Production",
    description: "Discover how to grow your own food sustainably while minimizing environmental impact. This course covers everything from seed selection to harvest.",
    category: "food",
    level: "intermediate",
    price: 79.99,
    discount: 0,
    isFree: false,
    duration: 240, // 4 hours
    image: "sustainable-food.jpg",
    instructor: {
      name: "Michael Chen",
      title: "Sustainable Agriculture Specialist",
      avatar: "michael-chen.jpg",
      bio: "Michael Chen is a certified permaculture designer and sustainable agriculture consultant with expertise in urban farming and food security."
    },
    content: {
      sections: [
        {
          title: "Sustainable Growing Methods",
          lessons: [
            {
              title: "Permaculture Principles",
              duration: 25,
              type: "video",
              content: "Introduction to permaculture design principles"
            }
          ]
        }
      ]
    },
    tags: ["sustainable", "food", "permaculture", "urban farming"],
    requirements: ["Basic gardening knowledge", "Access to growing space"],
    learningOutcomes: ["Design sustainable food systems", "Implement permaculture principles", "Maximize food production"],
    enrolledStudents: 890,
    rating: 4.7,
    reviewCount: 67
  },
  {
    title: "Plantation Management",
    description: "Master the art of plantation management for various crops. Learn about crop rotation, pest management, and maximizing yields.",
    category: "plantation",
    level: "advanced",
    price: 99.99,
    discount: 15,
    isFree: false,
    duration: 300, // 5 hours
    image: "plantation-management.jpg",
    instructor: {
      name: "Dr. Maria Rodriguez",
      title: "Plantation Management Expert",
      avatar: "maria-rodriguez.jpg",
      bio: "Dr. Maria Rodriguez has managed large-scale plantations for over 20 years and specializes in tropical crop management and sustainable plantation practices."
    },
    content: {
      sections: [
        {
          title: "Advanced Plantation Techniques",
          lessons: [
            {
              title: "Crop Rotation Strategies",
              duration: 30,
              type: "video",
              content: "Advanced crop rotation techniques for optimal soil health"
            }
          ]
        }
      ]
    },
    tags: ["plantation", "management", "crops", "tropical"],
    requirements: ["Intermediate farming experience", "Understanding of basic agriculture"],
    learningOutcomes: ["Manage large-scale plantations", "Implement crop rotation", "Optimize yields"],
    enrolledStudents: 456,
    rating: 4.9,
    reviewCount: 34
  },
  {
    title: "Introduction to Sustainability",
    description: "Free course introducing the fundamental concepts of sustainability and environmental conservation.",
    category: "sustainability",
    level: "beginner",
    price: 0,
    discount: 0,
    isFree: true,
    duration: 60, // 1 hour
    image: "sustainability-intro.jpg",
    instructor: {
      name: "Emma Wilson",
      title: "Environmental Educator",
      avatar: "emma-wilson.jpg",
      bio: "Emma Wilson is an environmental educator with a passion for making sustainability accessible to everyone. She has taught environmental science for over 10 years."
    },
    content: {
      sections: [
        {
          title: "Sustainability Basics",
          lessons: [
            {
              title: "What is Sustainability?",
              duration: 15,
              type: "video",
              content: "Introduction to sustainability concepts and principles"
            }
          ]
        }
      ]
    },
    tags: ["sustainability", "environment", "free", "basics"],
    requirements: ["No prior experience needed"],
    learningOutcomes: ["Understand sustainability principles", "Identify environmental challenges", "Learn basic conservation methods"],
    enrolledStudents: 3200,
    rating: 4.6,
    reviewCount: 156
  },
  {
    title: "Organic Cooking Masterclass",
    description: "Learn to cook delicious meals using organic ingredients. From farm to table, master the art of organic cooking.",
    category: "cooking",
    level: "intermediate",
    price: 69.99,
    discount: 25,
    isFree: false,
    duration: 200, // 3.3 hours
    image: "organic-cooking.jpg",
    instructor: {
      name: "Chef James Thompson",
      title: "Organic Chef & Food Educator",
      avatar: "james-thompson.jpg",
      bio: "Chef James Thompson is a certified organic chef with 12 years of experience in farm-to-table cooking. He has worked in Michelin-starred restaurants and now focuses on teaching others the art of organic cooking."
    },
    content: {
      sections: [
        {
          title: "Organic Cooking Techniques",
          lessons: [
            {
              title: "Selecting Organic Ingredients",
              duration: 20,
              type: "video",
              content: "How to choose the best organic ingredients for your dishes"
            }
          ]
        }
      ]
    },
    tags: ["cooking", "organic", "chef", "farm-to-table"],
    requirements: ["Basic cooking skills", "Access to kitchen"],
    learningOutcomes: ["Master organic cooking techniques", "Select quality ingredients", "Create farm-to-table meals"],
    enrolledStudents: 1120,
    rating: 4.8,
    reviewCount: 78
  },
  {
    title: "Advanced Organic Farming Techniques",
    description: "Master advanced organic farming methods with comprehensive content including PDF guides, video tutorials, and detailed text explanations.",
    category: "organic",
    level: "advanced",
    price: 89.99,
    discount: 15,
    isFree: false,
    duration: 180,
    image: "advanced-organic-farming.jpg",
    instructor: {
      name: "Dr. Sarah Green",
      title: "Senior Organic Farming Specialist",
      avatar: "sarah-green-avatar.jpg",
      bio: "Dr. Sarah Green has over 15 years of experience in organic farming and sustainable agriculture. She holds a PhD in Agricultural Sciences and has worked with farmers across the globe."
    },
    content: {
      sections: [
        {
          title: "Introduction to Advanced Organic Methods",
          description: "Learn the fundamentals of advanced organic farming techniques and their benefits.",
          duration: 45,
          topics: [
            {
              title: "Understanding Soil Health",
              description: "Deep dive into soil composition and organic matter management.",
              content: {
                text: "<h3>Soil Health Fundamentals</h3><p>Healthy soil is the foundation of successful organic farming. This topic covers:</p><ul><li>Soil composition and structure</li><li>Organic matter importance</li><li>Microbial activity</li><li>pH balance management</li></ul><p>Understanding these fundamentals will help you create the optimal growing environment for your crops.</p>",
                pdfFile: {
                  filename: "soil-health-guide.pdf",
                  originalName: "Advanced Soil Health Guide.pdf",
                  uploadDate: new Date()
                },
                youtubeVideo: {
                  title: "Soil Health Management",
                  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                  videoId: "dQw4w9WgXcQ",
                  duration: "15:30",
                  thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
                }
              },
              order: 0
            },
            {
              title: "Crop Rotation Strategies",
              description: "Master the art of crop rotation for sustainable farming.",
              content: {
                text: "<h3>Crop Rotation Mastery</h3><p>Crop rotation is essential for maintaining soil fertility and preventing pest buildup. Key strategies include:</p><ol><li>Planning rotation cycles</li><li>Understanding plant families</li><li>Nutrient management</li><li>Pest control through rotation</li></ol><p>This systematic approach ensures long-term soil health and crop productivity.</p>",
                pdfFile: {
                  filename: "crop-rotation-handbook.pdf",
                  originalName: "Crop Rotation Handbook.pdf",
                  uploadDate: new Date()
                },
                youtubeVideo: {
                  title: "Crop Rotation Planning",
                  url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
                  videoId: "9bZkp7q19f0",
                  duration: "12:45",
                  thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg"
                }
              },
              order: 1
            }
          ]
        },
        {
          title: "Natural Pest Management",
          description: "Learn effective organic pest control methods without harmful chemicals.",
          duration: 60,
          topics: [
            {
              title: "Beneficial Insects",
              description: "Harness the power of beneficial insects for natural pest control.",
              content: {
                text: "<h3>Beneficial Insects Guide</h3><p>Beneficial insects are nature's pest control agents. This comprehensive guide covers:</p><ul><li>Ladybugs and their role</li><li>Lacewings for aphid control</li><li>Parasitic wasps</li><li>Creating insect-friendly habitats</li></ul><p>Learn how to attract and maintain populations of these helpful creatures.</p>",
                pdfFile: {
                  filename: "beneficial-insects-guide.pdf",
                  originalName: "Beneficial Insects Guide.pdf",
                  uploadDate: new Date()
                },
                youtubeVideo: {
                  title: "Attracting Beneficial Insects",
                  url: "https://www.youtube.com/watch?v=ZZ5LpwO-An4",
                  videoId: "ZZ5LpwO-An4",
                  duration: "18:20",
                  thumbnail: "https://img.youtube.com/vi/ZZ5LpwO-An4/maxresdefault.jpg"
                }
              },
              order: 0
            },
            {
              title: "Organic Pesticides",
              description: "Make your own effective organic pesticides from natural ingredients.",
              content: {
                text: "<h3>DIY Organic Pesticides</h3><p>Create effective pest control solutions using natural ingredients:</p><h4>Neem Oil Spray</h4><p>Mix 2 tablespoons of neem oil with 1 gallon of water and a few drops of dish soap. Apply weekly to affected plants.</p><h4>Garlic Spray</h4><p>Blend 10 garlic cloves with 1 quart of water. Strain and spray on plants to repel pests.</p><p>These homemade solutions are safe for plants, beneficial insects, and the environment.</p>",
                pdfFile: {
                  filename: "organic-pesticides-recipe.pdf",
                  originalName: "Organic Pesticides Recipe Book.pdf",
                  uploadDate: new Date()
                },
                youtubeVideo: {
                  title: "Making Organic Pesticides",
                  url: "https://www.youtube.com/watch?v=8jLoD9aJcQw",
                  videoId: "8jLoD9aJcQw",
                  duration: "22:15",
                  thumbnail: "https://img.youtube.com/vi/8jLoD9aJcQw/maxresdefault.jpg"
                }
              },
              order: 1
            }
          ]
        }
      ]
    },
    tags: ["organic farming", "advanced techniques", "soil health", "pest management", "sustainable agriculture"],
    requirements: [
      "Basic understanding of farming",
      "Access to farming land",
      "Commitment to organic practices"
    ],
    learningOutcomes: [
      "Master advanced soil health management",
      "Implement effective crop rotation systems",
      "Control pests using natural methods",
      "Increase crop yields sustainably",
      "Reduce environmental impact"
    ],
    enrolledStudents: 678,
    rating: 4.9,
    reviewCount: 45
  }
];

const addSampleCourses = async () => {
  try {
    await mongoose.connect('mongodb+srv://banukaweerapperuma:nYrnjEqwMzSKymam@cluster0.cvd6b.mongodb.net/food-delivery');
    console.log('Connected to MongoDB');

    // Clear existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Add sample courses
    const courses = await Course.insertMany(sampleCourses);
    console.log(`Added ${courses.length} sample courses`);

    console.log('Sample courses added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample courses:', error);
    process.exit(1);
  }
};

addSampleCourses(); 