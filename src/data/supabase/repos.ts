import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Profile } from '@/domain/types'
import type { Repos } from '../interfaces'
import { MockPlacesProvider } from '../mockPlaces'
import { itemFromRow, listFromRow, placeFromRow, shareFromRow, shareToRow, sharedFromJson, visitFromRow, visitToRows, wantFromRow, type PlaceRow, type ShareRow, type VisitRow } from './mappers'

/** Throws on any Supabase error so TanStack Query surfaces it as a retryable failure. */
function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

/** A list query: no rows is an empty array, never null. */
function all<T>(res: { data: T[] | null; error: { message: string } | null }): T[] {
  return ok(res) ?? []
}

/** A `.single()` query: the row must exist. */
function one<T>(res: { data: T | null; error: { message: string } | null }): T {
  const row = ok(res)
  if (!row) throw new Error('Not found')
  return row
}

const profileOf = (u: User): Profile => ({ id: u.id, displayName: (u.email ?? '').split('@')[0] ?? '' })
const PHOTO_BUCKET = 'photos'
const looksLikePath = (id: string) => id.includes('/')

/** Everything except `drafts`, which always stays on the device. */
export function createSupabaseRepos(sb: SupabaseClient): Omit<Repos, 'drafts'> {
  const uid = async () => {
    const { data } = await sb.auth.getSession()
    if (!data.session) throw new Error('Not signed in')
    return data.session.user.id
  }

  return {
    auth: {
      mode: 'password',
      async getUser() {
        const { data } = await sb.auth.getSession()
        return data.session ? profileOf(data.session.user) : null
      },
      async signIn(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password })
        if (error || !data.user) throw new Error(error?.message ?? 'Sign-in failed')
        return profileOf(data.user)
      },
      async signUp(email, password) {
        const { data, error } = await sb.auth.signUp({ email, password })
        if (error) throw new Error(error.message)
        // No session means the project still requires email confirmation.
        return data.session && data.user ? profileOf(data.user) : null
      },
      async signOut() {
        const { error } = await sb.auth.signOut()
        if (error) throw new Error(error.message)
      },
    },

    places: {
      async list() {
        return all(await sb.from('my_places').select('*')).map((r) => placeFromRow(r as PlaceRow))
      },
      async get(id) {
        const row = ok(await sb.from('places').select('*').eq('id', id).maybeSingle())
        return row ? placeFromRow(row as PlaceRow) : undefined
      },
      async upsert(p) {
        const id = ok(await sb.rpc('ensure_place', { p })) as string
        return placeFromRow(ok(await sb.from('places').select('*').eq('id', id).single()) as PlaceRow)
      },
    },

    placeSearch: new MockPlacesProvider(), // Google Places needs a server-side key; swapped in later

    visits: {
      async list() {
        const rows = all(await sb.from('visits').select('*, visit_dishes(*), visit_photos(photo_id, position)').order('visited_on', { ascending: false }))
        return rows.map((r) => visitFromRow(r as VisitRow))
      },
      async get(id) {
        const row = ok(await sb.from('visits').select('*, visit_dishes(*), visit_photos(photo_id, position)').eq('id', id).maybeSingle())
        return row ? visitFromRow(row as VisitRow) : undefined
      },
      async save(v) {
        const { visit, dishes, photos } = visitToRows(v)
        ok(await sb.from('visits').upsert(visit, { onConflict: 'id' }))
        // Replace children. Not atomic: a failure mid-way can leave a visit without its dishes until retried.
        ok(await sb.from('visit_dishes').delete().eq('visit_id', v.id))
        if (dishes.length) ok(await sb.from('visit_dishes').insert(dishes))
        ok(await sb.from('visit_photos').delete().eq('visit_id', v.id))
        if (photos.length) ok(await sb.from('visit_photos').insert(photos))
        return (await this.get(v.id)) ?? v
      },
      async remove(id) {
        ok(await sb.from('visits').delete().eq('id', id))
      },
    },

    lists: {
      async lists() {
        return all(await sb.from('lists').select('*').order('position')).map(listFromRow)
      },
      async items(listId) {
        const q = sb.from('list_items').select('*').order('position')
        return all(await (listId ? q.eq('list_id', listId) : q)).map(itemFromRow)
      },
      async saveList(l) {
        ok(await sb.from('lists').upsert({ id: l.id, name: l.name, position: l.position }, { onConflict: 'id' }))
        return l
      },
      async removeList(id) {
        ok(await sb.from('lists').delete().eq('id', id)) // items cascade
      },
      async reorderLists(ids) {
        for (const [i, id] of ids.entries()) ok(await sb.from('lists').update({ position: i }).eq('id', id))
      },
      async saveItem(item) {
        ok(await sb.from('list_items').upsert({ id: item.id, list_id: item.listId, place_id: item.placeId, position: item.position, note: item.note }, { onConflict: 'id' }))
        return item
      },
      async removeItem(id) {
        ok(await sb.from('list_items').delete().eq('id', id))
      },
      async reorderItems(_listId, ids) {
        for (const [i, id] of ids.entries()) ok(await sb.from('list_items').update({ position: i }).eq('id', id))
      },
    },

    wants: {
      async list() {
        return all(await sb.from('want_items').select('*').order('added_at', { ascending: false })).map(wantFromRow)
      },
      async add(item) {
        ok(await sb.from('want_items').upsert({ id: item.id, place_id: item.placeId, note: item.note, added_at: item.addedAt }, { onConflict: 'user_id,place_id', ignoreDuplicates: true }))
        return wantFromRow(one(await sb.from('want_items').select('*').eq('place_id', item.placeId).single()))
      },
      async update(item) {
        ok(await sb.from('want_items').update({ note: item.note }).eq('id', item.id))
        return item
      },
      async remove(id) {
        ok(await sb.from('want_items').delete().eq('id', id))
      },
    },

    shares: {
      async create(s) {
        return shareFromRow(ok(await sb.from('shares').insert(shareToRow(s)).select('*').single()) as ShareRow)
      },
      async update(s) {
        ok(await sb.from('shares').update({ show_photos: s.showPhotos, show_tips: s.showTips }).eq('token', s.token))
        return s
      },
      async get(token) {
        const row = ok(await sb.from('shares').select('*').eq('token', token).maybeSingle())
        return row ? shareFromRow(row as ShareRow) : undefined
      },
      async forTarget(targetId) {
        return all(await sb.from('shares').select('*').eq('target_id', targetId)).map((r) => shareFromRow(r as ShareRow))
      },
      async revoke(token) {
        ok(await sb.from('shares').update({ revoked_at: new Date().toISOString() }).eq('token', token))
      },
    },

    // Recipients are anonymous: this is the only call they make, and it never returns private notes.
    shared: {
      async getShared(token) {
        return sharedFromJson(ok(await sb.rpc('get_shared', { p_token: token })))
      },
    },

    photos: {
      async put(blob) {
        const owner = await uid()
        const id = crypto.randomUUID()
        const path = `${owner}/${id}.jpg`
        const up = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg' })
        if (up.error) throw new Error(up.error.message)
        ok(await sb.from('photos').insert({ id, storage_path: path }))
        return id
      },
      /** `id` is a photo id for your own photos, or a storage path for photos on a shared page. */
      async url(id) {
        let path = id
        if (!looksLikePath(id)) {
          const row = ok(await sb.from('photos').select('storage_path').eq('id', id).maybeSingle())
          if (!row) return null
          path = (row as { storage_path: string }).storage_path
        }
        const { data, error } = await sb.storage.from(PHOTO_BUCKET).download(path)
        return error || !data ? null : URL.createObjectURL(data)
      },
      async remove(id) {
        const row = ok(await sb.from('photos').select('storage_path').eq('id', id).maybeSingle())
        if (row) await sb.storage.from(PHOTO_BUCKET).remove([(row as { storage_path: string }).storage_path])
        ok(await sb.from('photos').delete().eq('id', id))
      },
    },
  }
}
