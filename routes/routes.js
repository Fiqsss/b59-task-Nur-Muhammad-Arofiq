const express = require("express");

const {
  renderHome,
  renderTestimonial,
  getTestimonials,
  renderContact,
  render404,

} = require("../controllers/HomeContactController");

const {
  renderBlog,
  deleteBlog,
  addBlog,
  renderaddBlog,
  rendereditBlog,
  editBlog,
  searchBlog,
  renderDetailBlog
} = require("../controllers/BlogController");

const {
  renderProject,
  renderAddProject,
  renderEditProject,
  getProjects,
  getProjectDetails,
  addProject,
  deleteProject,
  searchProject,
  editProject
} = require("../controllers/ProjectController");

const router = express.Router();

router.get("/", renderHome);


// Home Contact Testimoni 
router.get("/contact", renderContact);
router.get("/testimonial", renderTestimonial);
router.get("/api/testimonials", getTestimonials);
// END Home Contact Testimoni 

// BLOG
router.get("/blog", renderBlog);
router.get("/addblog", renderaddBlog);
router.delete("/deleteblog/:id", deleteBlog);
router.get("/editblog/:id", rendereditBlog);
router.post("/addBlog", addBlog);
router.post("/editblog/:id", editBlog);
router.get("/searchblog", searchBlog);
router.get("/detailblog/:title", renderDetailBlog);
// END BLOG

// PROJECT
router.get("/project", renderProject);
router.get("/addproject", renderAddProject);
router.get("/api/projects", getProjects);
router.post("/addproject", addProject);
router.get("/project/:title", getProjectDetails);
router.delete("/deleteproject/:id", deleteProject);
router.get("/editproject/:id", renderEditProject);
router.post("/editproject/:id", editProject);
router.get("/searchproject", searchProject);
// END PROJECT

router.use("*", render404);

module.exports = router;
