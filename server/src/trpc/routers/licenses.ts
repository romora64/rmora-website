import { router, publicProcedure } from '../trpc';
import { db } from '../../db';
import { licenses } from '../../db/schema';

export const licensesRouter = router({
  getAll: publicProcedure.query(async () => {
    return db.select().from(licenses).orderBy(licenses.code);
  }),
});
