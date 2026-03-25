import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { DokumentenEingang } from '../components/DokumentenEingang'
import { FreieUploadsQueue } from '../components/FreieUploadsQueue'

export function DokumentePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dokumente</h1>

      <Tabs defaultValue="eingang">
        <TabsList>
          <TabsTrigger value="eingang">Eingang</TabsTrigger>
          <TabsTrigger value="freie_uploads">Freie Uploads</TabsTrigger>
        </TabsList>

        <TabsContent value="eingang">
          <DokumentenEingang />
        </TabsContent>

        <TabsContent value="freie_uploads">
          <FreieUploadsQueue />
        </TabsContent>
      </Tabs>
    </div>
  )
}
