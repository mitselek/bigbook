import { readFile, writeFile } from 'node:fs/promises'
import prettier from 'prettier'

export async function formatFile(filepath: string): Promise<void> {
  const source = await readFile(filepath, 'utf-8')
  const config = await prettier.resolveConfig(filepath)
  const formatted = await prettier.format(source, { ...config, filepath })
  if (formatted !== source) {
    await writeFile(filepath, formatted, 'utf-8')
  }
}

export async function formatFiles(filepaths: readonly string[]): Promise<void> {
  for (const path of filepaths) {
    await formatFile(path)
  }
}
