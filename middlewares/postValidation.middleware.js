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

export const createCommentValidation = [
  body("content")
    .notEmpty().withMessage("content is required")
    .isString().withMessage("content must be a string")
    .isLength({ min: 2 }).withMessage("content must be at least 2 characters"),

  body("parentId")
    .optional({ nullable: true })
    .isInt().withMessage("parentId must be a number if provided"),

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


// export const validateEdithPost = [
//  body("title")
//     .trim().escape().notEmpty().withMessage("Title is required.")
//     .isLength({ min: 5, max: 150 }).withMessage("Title must be between 5 and 150 characters."),

//   body("content")
//     .trim()
//     .notEmpty().withMessage("Content is required.").escape().isLength({ min: 20 }).withMessage("Content must be at least 20 characters long."),

//   body("category_id")
//     .optional()
//     .isInt({ min: 1 }).withMessage("Category ID must be a valid number."),
//     (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       const formattedError = errors.array().map((err) => ({
//         field: err.path,
//         message: err.msg,
//       }));
//       return res.status(400).json({ errors: formattedError });
//     }
//     next();
//   },
// ];
