
/**
 *
 * @param {Object} req request object
 * @param {Object} query query object
 * @param {Schema} Model schema to be used
 */
async function paginateRequest(req, query, Model) {
  try {
    query.populate = query.populate || [];
    const dbQuery = { ...query };
    delete dbQuery.populate;
    let { page, limit } = req.query;
    page = page && Number(page) > 0 ? Number(page) : 1;
    limit = limit && Number(limit) > 0 ? Number(limit) : 10;
    const sort = { $natural: -1 };
    return await Model.paginate(dbQuery, {
      select: { password: 0 }, sort, page, limit, populate: [...query.populate],
    });
  } catch (ex) {
    throw new Error(ex);
  }
}

module.exports = paginateRequest;
