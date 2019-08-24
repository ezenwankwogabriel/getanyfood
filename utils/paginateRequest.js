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
    delete dbQuery.populate;
    const sort = { $natural: -1 };

    const paginateOptions = {
      select: { password: 0 },
      sort,
      populate,
    };

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
