import { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../../libs/prisma";
import { redis } from "../../libs/redis";

export async function getPoll(app: FastifyInstance) {
  app.get('/polls/:pollId', async (req, rep) => {
    const getPollParams = z.object({
      pollId: z.string().uuid()
    })
  
    const { pollId } = getPollParams.parse(req.params)
  
    const poll = await prisma.poll.findUnique({
      where: {
        id: pollId
      },
      include: {
        options: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })
    
    if (!poll) {
      return rep.status(404).send({message: 'poll not found'})
    }

    const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')

    const votes = result.reduce((obj, line, index) => {
      if (index % 2 === 0) {
        const score = result[index + 1]
        
        Object.assign(obj, {
          [line]: Number(score)
        })

      }

      return obj
    }, {} as Record<string, number>)

    return rep.send({ 
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map((option) => {
          return {
            ...option,
            score: votes[option.id] || 0
          }
        })
      }
    })
  })
}