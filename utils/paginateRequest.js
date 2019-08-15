/**
 *
 * @param {Object} req request object
 * @param {Object} query query object
 * @param {Schema} Model schema to be used
 */
async function paginateRequest(req, query, Model) {
  try {
    const populate = query.populate || [];
    const dbQuery = { ...query };
    const sort = query.sort || { $natural: -1 };
    const select = query.select || ['password'];

    delete dbQuery.populate;
    delete dbQuery.sort;
    delete dbQuery.select;

    const paginateOptions = { select, sort, populate };

    const { page, limit, offset } = req.query;
    paginateOptions.limit = limit && Number(limit) > 0 ? Number(limit) : 20;
    if (page && Number(page) > 0) {
      paginateOptions.page = Number(page);
    }
    if (!page && offset && Number(offset)) {
      paginateOptions.offset = Number(offset);
    }
    return await Model.paginate(dbQuery, paginateOptions);
  } catch (ex) {
    throw new Error(ex);
  }
}

module.exports = paginateRequest;
