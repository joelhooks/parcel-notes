import mdx from '@mdx-js/mdx'
import detectFrontmatter from 'remark-frontmatter'
import {VFile} from 'vfile'
import {visit} from 'unist-util-visit'
import {remove} from 'unist-util-remove'
import fetch from 'isomorphic-fetch'
import toMarkdown from 'mdast-util-to-markdown'

async function load() {
    const result = await fetch(
        'https://gist.githubusercontent.com/joelhooks/081990a717be3b44c339a358ccd038b6/raw/925876b85d763edcd52be1cfe76ee62cd6d3a681/test.mdx',
    )

    return await result.text()
}

const text = await load()

const file = new VFile(text.trimStart())

function extractFrontmatter() {

    return function transformer(tree, file) {
        file.data.notes = []
        visit(tree, 'mdxJsxFlowElement', function visitor(node) {
            file.data.notes.push(node)
        })
        remove(tree, 'mdxJsxFlowElement')
    }
}

const mdxCompiler = mdx.createCompiler({
    remarkPlugins: [detectFrontmatter, extractFrontmatter]
})

mdxCompiler.process(file, function done(err, file) {
    const notes = file.data.notes.map((note) => {
        const attributes = note.attributes.reduce((acc, attribute) => {
            return {
                ...acc,
                [attribute.name]: Number(attribute.value.value)
            }
        }, {})
        note.type = 'root'
        const contents = toMarkdown(note)
        return {
            text: contents,
            ...attributes
        }
    })

    console.log(notes)
})