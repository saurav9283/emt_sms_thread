const { promise_pool } = require("./database")

async function calculateRevenue(service) {
  for (let day = 0; day < 4; day++) {
    try {
      let revenue_query
        = process.env.revenue_Q
          .replaceAll('<SERVICE>', service)
          .replaceAll('<DAY>', day);
      // console.log(revenue_query)
      const [row] = await promise_pool.query(
        revenue_query
      );
      // console.log(row)
      if (row.length > 0) {
        row.map(
          async entrys => {
            const { revenue, total_revenue } = entrys;
            if (
              revenue == null ||
              total_revenue == null
            ) {
              console.log("mis is empty =>")
              return 'revenue is empty =>'
            }
            let update_Q
              = process.env.update_Q
                .replace('<DAY>', day)
                .replace('<SERVICE>', service)
                .replace("<REV>", revenue)
                .replace("<TOTAL_REV>", total_revenue);
            // console.log(update_Q)
            const [updated] = await promise_pool.query(update_Q);
            console.log("mis_updated ->", updated.info);
            return "success";
          }
        )
      }
    } catch (e) {
      console.log(e);
      return "error";
    }
  }
}

module.exports = { calculateRevenue }