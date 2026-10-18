import { ApiError } from '../lib/api-error.js';

function fieldErrors(error) {
  const flattened = error.flatten();
  return { ...flattened.fieldErrors, ...flattened.formErrors };
}

export function validateBody(schema) {
  return function validate(req, _res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(
        new ApiError(
          400,
          'Please check the highlighted fields.',
          fieldErrors(result.error)
        )
      );
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return function validate(req, _res, next) {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return next(
        new ApiError(400, 'That filter is not valid.', fieldErrors(result.error))
      );
    }

    req.validatedQuery = result.data;
    next();
  };
}
