package okhttp3

import java.io.IOException
import java.net.HttpURLConnection
import java.net.Proxy
import java.net.URL
import java.net.URLConnection
import java.net.URLStreamHandler
import java.net.URLStreamHandlerFactory

/**
 * Compatibility shim for ML Kit Digital Ink Recognition 16.x.
 *
 * ML Kit 16.x internally uses okhttp3.OkUrlFactory (from okhttp-urlconnection:3.x)
 * for model downloads. This class was removed in OkHttp 4.x and is no longer
 * shipped as a transitive dependency. Providing it here ensures the class is
 * present in the final DEX so ML Kit can load it.
 *
 * The implementation delegates to standard java.net HTTP so actual model
 * downloads (HTTPS GET to Google servers) work correctly.
 */
@Suppress("unused")
class OkUrlFactory(private val client: OkHttpClient) : URLStreamHandlerFactory, Cloneable {

    fun client(): OkHttpClient = client

    @Throws(IOException::class)
    fun open(url: URL): HttpURLConnection = open(url, Proxy.NO_PROXY)

    @Throws(IOException::class)
    fun open(url: URL, proxy: Proxy?): HttpURLConnection {
        val effectiveProxy = proxy ?: Proxy.NO_PROXY
        return url.openConnection(effectiveProxy) as HttpURLConnection
    }

    override fun createURLStreamHandler(protocol: String?): URLStreamHandler? {
        if (protocol != "http" && protocol != "https") return null
        return object : URLStreamHandler() {
            @Throws(IOException::class)
            override fun openConnection(url: URL): HttpURLConnection = open(url)

            @Throws(IOException::class)
            override fun openConnection(url: URL, proxy: Proxy): HttpURLConnection = open(url, proxy)
        }
    }

    @Throws(CloneNotSupportedException::class)
    public override fun clone(): OkUrlFactory = OkUrlFactory(client)
}
