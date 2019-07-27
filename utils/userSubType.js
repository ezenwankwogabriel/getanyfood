
function userSubType(type) {
  let subType;
  switch (type) {
    case 'super_admin': subType = 'sub_admin'; break;
    case 'merchant': subType = 'sub_merchant'; break;

    default:
      break;
  }
  return subType;
}

module.exports = userSubType;
