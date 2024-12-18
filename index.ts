import { Context, Schema, h } from 'koishi'
import {} from 'koishi-plugin-smmcat-localstorage'

export const name = 'jianbingbot-hyp'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    ctx.command('hyp <player>')
        .action(async ({ session }, player) => {
            const userId = session.userId
            const lastActionTime = await ctx.localstorage.getItem(`${userId}_last_command_time`)
            const currentTime = Date.now()
      
            await ctx.localstorage.setItem(`${userId}_last_command_time`, currentTime.toString())
      
            // command time limit
            if (lastActionTime && currentTime - parseInt(lastActionTime) < 5000) {
              await session.send('操作过快！请稍等5秒')
              return
            }
            //get UUID
            const mojangApiUrl = `https://api.mojang.com/users/profiles/minecraft/${player}`
            let uuid: string | null = null

            try {
                const mojangResponse = await fetch(mojangApiUrl)
                const mojangData = await mojangResponse.json()

                if (mojangResponse.ok && mojangData.id) {
                    uuid = mojangData.id
                } else {
                    return `无法找到玩家 ${player} 的 UUID`
                }
            } catch (error) {
                return `无法获取玩家 ${player} 的 UUID: ${error.message}`
            }

            if (!uuid) {
                return `无法找到玩家 ${player} 的 UUID`
            }

            //get hypixle stats
            const hypixelApiUrl = `https://api.hypixel.net/player?key=API_KEY&uuid=${uuid}`
            let playerData

            try {
                const hypixelResponse = await fetch(hypixelApiUrl)
                const hypixelData = await hypixelResponse.json()

                if (hypixelData.success === false) {
                    return `无法获取玩家 ${player} 的 Hypixel 数据`
                }
                playerData = hypixelData.player
            } catch (error) {
                return `无法获取玩家 ${player} 的 Hypixel 数据: ${error.message}`
            }

            //return lvl, karma, status
            const level = playerData.level || '未知'
            const karma = playerData.karma || '未知'
            const onlineStatus = playerData.online ? '在线' : '离线'

            return `玩家：${player}\n等级：${level}\n人品值：${karma}\n在线状态：${onlineStatus}`
        })
}
