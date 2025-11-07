import { body, validationResult } from "express-validator";
export const validatePost = [
 body("title")
    .trim()
    .notEmpty().withMessage("Title is required.")
    .isLength({ min: 5, max: 150 }).withMessage("Title must be between 5 and 150 characters."),

  body("content")
    .trim()
    .notEmpty().withMessage("Content is required.")
    .isLength({ min: 20 }).withMessage("Content must be at least 20 characters long."),

  body("category_id")
    .optional()
    .isInt({ min: 1 }).withMessage("Category ID must be a valid number."),

  // body("image_url")
  //   .optional()
  //   .isURL().withMessage("Image URL must be a valid URL."),
    (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedError = errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      }));
      return res.status(400).json({ errors: formattedError });
    }
    next();
  },
];