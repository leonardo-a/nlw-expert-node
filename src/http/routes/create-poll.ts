import { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../libs/prisma";

export async function createPoll(app: FastifyInstance) {
  app.post('/polls', async (req, rep) => {
    const createPollBody = z.object({
      title: z.string(),
      options: z.array(z.string()).min(2)
    })
  
    const { title, options } = createPollBody.parse(req.body)
  
    const poll = await prisma.poll.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map((option) => {
              return {
                title: option,
              }
            })
          }
        }
      }
    })
  
    return rep.status(201).send({
      pollId: poll.id,
    })
  })
}