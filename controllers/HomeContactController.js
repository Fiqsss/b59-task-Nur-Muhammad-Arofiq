exports.renderHome = (req, res) => {
  res.render("home", { actived: "home", title: "Home | Dumbways Task" });
};

exports.renderContact = (req, res) => {
  res.render("contact", {
    actived: "contact",
    title: "Contact | Dumbways Task",
  });
};

exports.getTestimonials = async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM testimonial");
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

exports.renderTestimonial = (req, res) => {
  res.render("testimonial", {
    actived: "testimonial",
    title: "Testimonial | Dumbways Task",
  });
};

exports.render404 = (req, res) => {
    res.status(404).render("partials/404");
  };
  