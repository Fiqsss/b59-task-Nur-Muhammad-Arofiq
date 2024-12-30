const { getRelativeTime, formatDate } = require("../utils/time");
const fs = require("fs");
const path = require("path");
const { truncateText } = require("../utils/truncateText");
const { Sequelize, QueryTypes } = require("sequelize");
const config = require("../config/config");
const sequelize = new Sequelize(config.development);

const { blogs } = require("../models");

exports.searchBlog = async (req, res) => {
  const searchQuery = req.query.search;

  if (!searchQuery) {
    return res.redirect("/blog");
  }

  try {
    const result = await sequelize.query(
      'SELECT * FROM blogse WHERE title LIKE :search Order by "createdAt" DESC',
      {
        type: QueryTypes.SELECT,
        replacements: { search: `%${searchQuery}%` },
      }
    );

    const updatedBlogs = result.map((blog) => {
      const postDate = new Date(blog.post_date);
      const formattedDate = postDate
        .toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
        .toString();

      return {
        ...blog,
        time: getRelativeTime(postDate),
        postDate: formattedDate,
        content: truncateText(blog.content, 150),
      };
    });

    res.render("blog", {
      actived: "blog",
      title: "Blog | Dumbways Task",
      blogs: updatedBlogs,
      searchQuery: searchQuery,
    });
  } catch (err) {
    console.error("Error searching blogs:", err.message);
    res.render("partials/404");
  }
};

exports.renderBlog = async (req, res) => {
  try {
    const [data] = await sequelize.query(
      "SELECT * FROM blogs ORDER BY post_date DESC"
    );

    if (data.length === 0) {
      return res.render("blog", {
        title: "Blog | Dumbways Task",
        blogs: [],
      });
    }

    const blogs = data.map((blog) => {
      const postDate = blog.post_date ? new Date(blog.post_date) : new Date();
      const formattedDate = postDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      return {
        ...blog,
        content: truncateText(blog.content, 150),
        time: getRelativeTime(postDate),
        postDate: formattedDate,
      };
    });

    res.render("blog", {
      actived: "blog",
      title: "Blog | Dumbways Task",
      blogs: blogs,
    });
  } catch (err) {
    console.error("Error fetching blog posts:", err.message);
    res.render("partials/404");
  }
};

exports.renderDetailBlog = async (req, res) => {
  try {
    const result = await sequelize.query(
      `SELECT * FROM blogs WHERE title = '${req.params.title}'`,
      {
        type: QueryTypes.SELECT,
      }
    );

    if (result.length === 0) {
      return res.status(404).render("error", {
        message: "Blog not found.",
      });
    }

    const blog = result[0];
    const postDate = blog.post_date ? new Date(blog.post_date) : null;

    if (!postDate || isNaN(postDate)) {
      console.warn("Invalid post_date for blog:", blog);
      return res.status(500).render("error", {
        message: "Invalid post date in blog data.",
      });
    }

    const formattedDate = postDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    blog.time = getRelativeTime(postDate);
    blog.postDate = formattedDate;

    res.render("partials/blog/detailblog", {
      title: "Blog | Dumbways Task",
      blog: blog,
    });
  } catch (err) {
    console.error(err.message);
    res.render("partials/404");

  }
};

exports.renderaddBlog = (req, res) => {
  res.render("partials/blog/addblog", { title: "Add Blog | Dumbways Task" });
};
exports.addBlog = async (req, res) => {
  console.log("Request Body:", req.body);
  console.log("Uploaded Files:", req.files);

  let imageFileName = null;
  const { title, content } = req.body;
  const uploadDir = path.resolve(__dirname, "../public/img/blog/");

  try {
    if (!title || !content) {
      return res.status(400).send("Title dan content harus diisi.");
    }

    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const allowedExtensions = /jpg|jpeg|png|gif/;
      const fileExtension = path.extname(imageFile.name).toLowerCase();

      if (!allowedExtensions.test(fileExtension)) {
        return res
          .status(400)
          .send("Hanya file gambar yang diperbolehkan (jpg, jpeg, png, gif).");
      }

      imageFileName = `${Date.now()}_${imageFile.name}`;
      const uploadPath = path.join(uploadDir, imageFileName);

      // Membuat direktori jika belum ada
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      await new Promise((resolve, reject) => {
        imageFile.mv(uploadPath, (err) => {
          if (err) {
            console.error("Gagal mengunggah gambar:", err);
            reject(err);
          } else {
            console.log("Gambar berhasil diunggah ke:", uploadPath);
            resolve();
          }
        });
      });
    }
    const postDate = new Date();
    const newBlog = await blogs.create({
      title,
      content,
      image: imageFileName,
      post_date: postDate,
    });

    console.log("Blog berhasil disimpan ke database:", newBlog);
    res.redirect("/blog?action=add"); // Mengalihkan setelah berhasil
  } catch (error) {
    console.error("Gagal menambahkan blog:", error.message);
    res.status(500).send("Gagal menambahkan blog. Silakan coba lagi.");
  }
};

exports.deleteBlog = async (req, res) => {
  const id = req.params.id;
  const uploadDir = path.resolve(__dirname, "../public/img/blog/");

  try {
    const blog = await blogs.findOne({
      where: { id },
    });

    if (!blog) {
      return res.status(404).send("Blog tidak ditemukan");
    }

    const imageDestroy = blog.image;

    await blogs.destroy({
      where: { id },
    });

    if (imageDestroy) {
      const imagePath = path.join(uploadDir, imageDestroy);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Gambar berhasil dihapus.");
      }
    }

    res.redirect("/blog?action=delete");
  } catch (err) {
    console.error("Gagal menghapus blog:", err.message);
    res.status(500).render("partials/404");
  }
};

exports.rendereditBlog = async (req, res) => {
  try {
    const [results] = await sequelize.query(
      `SELECT * FROM blogs WHERE id = '${req.params.id}'`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );
    if (results.length === 0) {
      return res.status(404).render("partials/404");
      message: "Blog not found.";
    }

    blog = results;
    res.render("partials/blog/editblog", {
      title: "Edit Blog | Dumbways Task",
      blog,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).render("partials/404");
  }
};

exports.editBlog = async (req, res) => {
  const id = req.params.id;
  const { title, content } = req.body;
  let imageFileName = null;

  const uploadDir = path.resolve(__dirname, "../public/img/blog/");

  try {
    const result = await sequelize.query(
      `SELECT image FROM blogs WHERE id = :id`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      }
    );
    const oldImage = result.length > 0 ? result[0].image : null;
    console.log("Gambar lama:", oldImage);
    console.log("result :", result.length);
    console.log(req.files);

    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      imageFileName = `${Date.now()}_${imageFile.name}`;

      if (oldImage) {
        const oldImagePath = path.join(uploadDir, oldImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log("Gambar lama berhasil dihapus");
        }
      }

      const uploadPath = path.join(uploadDir, imageFileName);
      await new Promise((resolve, reject) => {
        imageFile.mv(uploadPath, (err) => {
          if (err) {
            console.error("Gagal mengunggah gambar:", err);
            reject(err);
          } else {
            console.log("Gambar berhasil diunggah");
            resolve();
          }
        });
      });
    } else {
      imageFileName = oldImage;
    }

    const query = `
      UPDATE blogs
      SET title = :title, content = :content, image = :image
      WHERE id = :id
    `;
    const values = {
      title,
      content,
      image: imageFileName,
      id,
    };

    await sequelize.query(query, {
      replacements: values,
      type: QueryTypes.UPDATE,
    });

    console.log("Blog berhasil diupdate");
    res.redirect(`/blog?action=update`);
  } catch (error) {
    console.error("Gagal memperbarui blog:", error.message);
    res.status(500).send("Gagal memperbarui blog");
  }
};
// 404 Controller
